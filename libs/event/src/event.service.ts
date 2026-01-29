import { Injectable, BadRequestException } from '@nestjs/common';
import { EventRepository } from './repositories/event.repository';
import { EventImageRepository } from './repositories/event_image.repository';
import { SavedEventRepository } from './repositories/saved_event.repository';
import { EventCategoryMapRepository } from './repositories/event_category_map.repository';
import { EventRegistrationRepository } from './repositories/event_registration.repository';
import { EventCategoryRepository } from '@app/event-category/repositories/event_category.repository';
import {
  CreateEventDto,
  UpdateEventDto,
  GetEventDto,
  UpdateEventImageDto,
  GetEventMapViewDto,
  GetSavedEventDto,
} from './dtos/event.dto';
import { EventModel } from './models/event.entity';
import { EventCategoryMapModel } from './models/event_category_map.entity';
import { EventImageModel } from './models/event_image.entity';
import { SavedEventModel } from './models/saved_event.entity';
import {
  EventRegistrationModel,
  EventRegistrationStatus,
} from './models/event_registration.entity';
import {
  GetPaginationOptions,
  GenerateShortCode,
} from '@app/common/helpers/misc.helper';
import { In } from 'typeorm';
import { DeleteAWSFile } from '@app/common/helpers/media.helper';
import { PaginationParam } from '@app/common/base/base.dto';

@Injectable()
export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private eventImageRepository: EventImageRepository,
    private eventCategoryRepository: EventCategoryRepository,
    private savedEventRepository: SavedEventRepository,
    private eventCategoryMapRepository: EventCategoryMapRepository,
    private eventRegistrationRepository: EventRegistrationRepository,
  ) {}

  private resolveGridSize(zoom?: number): number {
    if (zoom === undefined || zoom === null) {
      return 0.05;
    }
    if (zoom >= 18) return 0.0005;
    if (zoom >= 16) return 0.001;
    if (zoom >= 14) return 0.0025;
    if (zoom >= 12) return 0.005;
    if (zoom >= 10) return 0.02;
    if (zoom >= 8) return 0.05;
    if (zoom >= 6) return 0.1;
    return 0.25;
  }

  private async resolveEventCategories(
    categoryIds: number[],
    primaryCategoryId?: number,
  ) {
    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (!uniqueCategoryIds.length) {
      throw new BadRequestException('At least one category is required');
    }

    const resolvedPrimaryCategoryId = primaryCategoryId ?? uniqueCategoryIds[0];

    if (!uniqueCategoryIds.includes(resolvedPrimaryCategoryId)) {
      throw new BadRequestException(
        'Primary category must be included in category_ids',
      );
    }

    const categoriesCount = await this.eventCategoryRepository.Count({
      id: In(uniqueCategoryIds),
    });

    if (categoriesCount !== uniqueCategoryIds.length) {
      throw new BadRequestException('One or more categories are invalid');
    }

    return {
      categoryIds: uniqueCategoryIds,
      primaryCategoryId: resolvedPrimaryCategoryId,
    };
  }

  private async updateEventCategoryMappings(params: {
    eventId: number;
    categoryIds?: number[];
    primaryCategoryId?: number;
  }) {
    if (!params.categoryIds && !params.primaryCategoryId) {
      return;
    }

    const existingMappings = await this.eventCategoryMapRepository.Find({
      event_id: params.eventId,
    });

    const existingCategoryIds = existingMappings.map(
      (category) => +category.category_id,
    );
    const existingPrimaryCategoryId = existingMappings.find(
      (category) => category.is_primary,
    )?.category_id;
    const normalizedPrimaryCategoryId =
      existingPrimaryCategoryId !== undefined
        ? +existingPrimaryCategoryId
        : undefined;

    if (!params.categoryIds) {
      if (!existingCategoryIds.length) {
        throw new BadRequestException('Event categories not found');
      }
      const primaryCategoryId = params.primaryCategoryId;
      if (!primaryCategoryId) {
        throw new BadRequestException('Primary category is required');
      }
      if (!existingCategoryIds.includes(primaryCategoryId)) {
        throw new BadRequestException(
          'Primary category must be one of the event categories',
        );
      }

      await this.eventCategoryMapRepository.Update(
        { event_id: params.eventId },
        { is_primary: false },
      );
      await this.eventCategoryMapRepository.Update(
        {
          event_id: params.eventId,
          category_id: primaryCategoryId,
        },
        { is_primary: true },
      );
      return;
    }

    const fallbackPrimaryCategoryId =
      params.primaryCategoryId ??
      (normalizedPrimaryCategoryId &&
      params.categoryIds.includes(normalizedPrimaryCategoryId)
        ? normalizedPrimaryCategoryId
        : undefined);
    const { categoryIds, primaryCategoryId } =
      await this.resolveEventCategories(
        params.categoryIds,
        fallbackPrimaryCategoryId,
      );

    const toRemove = existingCategoryIds.filter(
      (id) => !categoryIds.includes(id),
    );
    if (toRemove.length) {
      await this.eventCategoryMapRepository.Delete({
        event_id: params.eventId,
        category_id: In(toRemove),
      });
    }

    const toAdd = categoryIds.filter((id) => !existingCategoryIds.includes(id));
    if (toAdd.length) {
      const newMappings = toAdd.map((categoryId) => {
        const mapping = new EventCategoryMapModel();
        mapping.event_id = params.eventId;
        mapping.category_id = categoryId;
        mapping.is_primary = false;
        return mapping;
      });
      await this.eventCategoryMapRepository.CreateAll(newMappings);
    }

    await this.eventCategoryMapRepository.Update(
      { event_id: params.eventId },
      { is_primary: false },
    );
    await this.eventCategoryMapRepository.Update(
      { event_id: params.eventId, category_id: primaryCategoryId },
      { is_primary: true },
    );
  }

  public async CreateEvent(
    body: CreateEventDto,
    actorId: number,
    isAdmin: boolean,
  ): Promise<EventModel> {
    const { categoryIds, primaryCategoryId } =
      await this.resolveEventCategories(
        body.category_ids,
        body.primary_category_id,
      );

    const event = new EventModel();
    event.name = body.name;
    event.description = body.description;
    event.location_name = body.location_name;
    event.address = body.address;
    event.geo_location = body.geo_location;
    event.start_time = body.start_time;
    event.end_time = body.end_time;
    event.is_private = body.is_private ?? false;
    event.capacity = body.capacity;
    event.require_approval = body.require_approval ?? false;
    event.city = body.city?.toLowerCase();
    event.created_by = actorId;
    event.host_id = isAdmin ? null : actorId;
    event.share_code = GenerateShortCode();
    event.registration_open = body.registration_open ?? true;

    const savedEvent = await this.eventRepository.Create(event);

    const eventCategories = categoryIds.map((categoryId) => {
      const mapping = new EventCategoryMapModel();
      mapping.event_id = savedEvent.id;
      mapping.category_id = categoryId;
      mapping.is_primary = categoryId === primaryCategoryId;
      return mapping;
    });

    await this.eventCategoryMapRepository.CreateAll(eventCategories);

    return await this.GetEventById(savedEvent.id);
  }

  public async GetEvents(query: GetEventDto, userId?: number | null) {
    const [events, count] = await this.eventRepository.GetEvents(query, userId);

    return { events, count };
  }

  public async GetSavedEvents(query: GetSavedEventDto, userId: number) {
    return await this.eventRepository.GetSavedEvents(userId, query);
  }

  public async GetHostedEvents(query: PaginationParam, userId: number) {
    return await this.eventRepository.GetHostedEvents(userId, query);
  }

  public async GetRegisteredEvents(query: PaginationParam, userId: number) {
    return await this.eventRepository.GetRegisteredEvents(userId, query);
  }

  public async GetAttendedEvents(query: PaginationParam, userId: number) {
    return await this.eventRepository.GetRegisteredEvents(userId, query, true);
  }

  public async SaveEvent(eventId: number, userId: number) {
    const event = await this.eventRepository.FindOne({
      id: eventId,
    });
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const existing = await this.savedEventRepository.FindOne({
      user_id: userId,
      event_id: eventId,
    });
    if (existing) {
      return { success: true };
    }

    const savedEvent = new SavedEventModel();
    savedEvent.user_id = userId;
    savedEvent.event_id = eventId;
    await this.savedEventRepository.Create(savedEvent);

    return { success: true };
  }

  public async UnsaveEvent(eventId: number, userId: number) {
    const savedEvent = await this.savedEventRepository.FindOne({
      user_id: userId,
      event_id: eventId,
    });
    if (!savedEvent) {
      throw new BadRequestException('Saved event not found');
    }

    await this.savedEventRepository.Delete({
      user_id: savedEvent.user_id,
      event_id: savedEvent.event_id,
    });

    return { success: true };
  }

  public async RegisterEvent(eventId: number, userId: number) {
    const eventPromise = this.eventRepository.FindOne({
      id: eventId,
      is_deleted: false,
    });
    const registrationCountPromise = this.eventRegistrationRepository.Count({
      event_id: eventId,
      status: EventRegistrationStatus.APPROVED,
    });
    const [event, registrationCount] = await Promise.all([
      eventPromise,
      registrationCountPromise,
    ]);
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    let registration = await this.eventRegistrationRepository.FindOne({
      user_id: userId,
      event_id: eventId,
    });

    if (registration) {
      return registration;
    }

    if (!event.registration_open) {
      throw new BadRequestException('Event registration is closed');
    }

    registration = new EventRegistrationModel();
    registration.user_id = userId;
    registration.event_id = eventId;
    registration.created_at = new Date();
    // TODO: For now, ignore require_approval and automatically approve
    registration.status = EventRegistrationStatus.APPROVED;

    await this.eventRegistrationRepository.Create(registration);

    if (event.capacity && registrationCount + 1 >= event.capacity) {
      event.registration_open = false;
      await this.eventRepository.Update(
        { id: eventId },
        { registration_open: false },
      );
    }

    return registration;
  }

  public async UnregisterEventByGuest(eventId: number, userId: number) {
    const registration = await this.eventRegistrationRepository.FindOne({
      user_id: userId,
      event_id: eventId,
    });
    if (!registration) {
      throw new BadRequestException('Registration not found');
    }

    await this.eventRegistrationRepository.Delete({
      user_id: userId,
      event_id: eventId,
    });

    return { success: true };
  }

  public async UnregisterUserFromEvent(
    eventId: number,
    userId: number,
    actorId?: number,
    isAdmin = false,
  ) {
    if (!isAdmin && actorId) {
      const event = await this.eventRepository.FindOne({
        id: eventId,
        host_id: actorId,
      });
      if (!event) {
        throw new BadRequestException(
          'You are not authorized to unregister users from this event',
        );
      }
    }

    const registration = await this.eventRegistrationRepository.FindOne({
      user_id: userId,
      event_id: eventId,
    });
    if (!registration) {
      throw new BadRequestException('Registration not found');
    }

    await this.eventRegistrationRepository.Delete({
      user_id: userId,
      event_id: eventId,
    });

    return { success: true };
  }

  public async GetEventRegistrations(
    eventId: number,
    params: PaginationParam,
    actorId?: number,
    isAdmin = false,
  ) {
    if (!isAdmin && actorId) {
      const event = await this.eventRepository.FindOne({
        id: eventId,
        host_id: actorId,
      });
      if (!event) {
        throw new BadRequestException(
          'You are not authorized to view registrations for this event',
        );
      }
    }

    return await this.eventRegistrationRepository.GetEventRegistrations(
      eventId,
      params,
    );
  }

  public async GetEventById(id: number): Promise<EventModel> {
    const event = await this.eventRepository.GetEventByIdOrShareCode({ id });

    if (!event) {
      throw new BadRequestException('Event not found');
    }

    return event;
  }

  public async GetMapViewEvents(
    query: GetEventMapViewDto,
    userId?: number | null,
  ) {
    if (
      (query.user_lat && !query.user_lng) ||
      (!query.user_lat && query.user_lng)
    ) {
      throw new BadRequestException('Both user_lat and user_lng are required');
    }
    if (query.max_distance && (!query.user_lat || !query.user_lng)) {
      throw new BadRequestException(
        'user_lat and user_lng are required for max_distance',
      );
    }

    const gridSize = this.resolveGridSize(query.zoom);
    const categoryIds =
      query.category_ids && query.category_ids.length
        ? query.category_ids
        : null;

    return await this.eventRepository.GetMapViewEvents({
      gridSize,
      swLng: query.sw_lng,
      swLat: query.sw_lat,
      neLng: query.ne_lng,
      neLat: query.ne_lat,
      userId,
      userLat: query.user_lat ?? null,
      userLng: query.user_lng ?? null,
      maxDistance: query.max_distance ?? null,
      categoryIds,
      rangeStart: query.date_range?.start ?? null,
      rangeEnd: query.date_range?.end ?? null,
    });
  }

  public async GetEventByShareCode(shareCode: string): Promise<EventModel> {
    const event = await this.eventRepository.GetEventByIdOrShareCode({
      share_code: shareCode,
    });

    if (!event) {
      throw new BadRequestException('Event not found');
    }

    return event;
  }

  public async UpdateEvent(
    id: number,
    body: UpdateEventDto,
    actorId: number,
    isAdmin: boolean,
  ): Promise<EventModel> {
    const event = await this.GetEventById(id);

    if (!isAdmin && event.host_id != actorId) {
      throw new BadRequestException(
        'You are not authorized to update this event',
      );
    }

    const updateData: any = { ...body };
    delete updateData.category_ids;
    delete updateData.primary_category_id;
    updateData.updated_by = actorId;

    await this.eventRepository.Update({ id }, updateData);
    await this.updateEventCategoryMappings({
      eventId: id,
      categoryIds: body.category_ids,
      primaryCategoryId: body.primary_category_id,
    });

    return await this.GetEventById(id);
  }

  public async CancelEvent(
    id: number,
    actorId: number,
    isAdmin: boolean,
  ): Promise<boolean> {
    const event = await this.GetEventById(id);

    if (!isAdmin && event.host_id != actorId) {
      throw new BadRequestException(
        'You are not authorized to cancel this event',
      );
    }

    await this.eventRepository.DeleteById(id, true);
    await this.eventImageRepository.Update(
      { event_id: id },
      { is_deleted: true },
    );

    // TODO: send notifications to all guests.

    return true;
  }

  public async UploadEventImages(
    id: number,
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    actorId: number,
    isAdmin: boolean,
  ): Promise<EventImageModel[]> {
    const event = await this.GetEventById(id);

    if (!isAdmin && event.host_id != actorId) {
      throw new BadRequestException(
        'You are not authorized to upload images for this event',
      );
    }

    const eventImages: EventImageModel[] = [];

    if (files.thumbnail && files.thumbnail.length > 0) {
      // Unset previous thumbnail
      await this.eventImageRepository.Update(
        { event_id: id, is_thumbnail: true },
        { is_thumbnail: false },
      );

      const thumbnailFile = files.thumbnail[0];
      const thumbnailImage = new EventImageModel();
      thumbnailImage.event_id = id;
      thumbnailImage.url = thumbnailFile['location'];
      thumbnailImage.is_thumbnail = true;
      thumbnailImage.created_by = actorId;
      eventImages.push(thumbnailImage);
    }

    if (files.images && files.images.length > 0) {
      files.images.forEach((file) => {
        const eventImage = new EventImageModel();
        eventImage.event_id = id;
        eventImage.url = file['location'];
        eventImage.is_thumbnail = false;
        eventImage.created_by = actorId;
        eventImages.push(eventImage);
      });
    }

    if (!eventImages.length) {
      throw new BadRequestException('No images provided');
    }

    return await this.eventImageRepository.CreateAll(eventImages);
  }

  public async UpdateEventImage(
    eventId: number,
    imageId: number,
    body: UpdateEventImageDto,
    actorId: number,
    isAdmin: boolean,
  ): Promise<EventImageModel> {
    if (!isAdmin) {
      const event = await this.eventRepository.FindOne({
        id: eventId,
        host_id: actorId,
      });

      if (!event) {
        throw new BadRequestException('Event not found');
      }
    }
    const image = await this.eventImageRepository.FindOne({
      id: imageId,
      event_id: eventId,
    });
    if (!image) {
      throw new BadRequestException('Event image not found');
    }

    if (body.is_thumbnail) {
      // Unset previous cover image for this event
      await this.eventImageRepository.Update(
        { event_id: eventId, is_thumbnail: true },
        { is_thumbnail: false },
      );
    }

    image.is_thumbnail = body.is_thumbnail;
    await this.eventImageRepository.Update(
      { id: imageId },
      { ...body, updated_by: actorId },
    );

    return image;
  }

  public async DeleteEventImage(
    eventId: number,
    imageIds: number[],
    actorId: number,
    isAdmin: boolean,
  ) {
    if (!isAdmin) {
      const event = await this.eventRepository.FindOne({
        id: eventId,
        host_id: actorId,
      });

      if (!event) {
        throw new BadRequestException('Event not found');
      }
    }

    const images = await this.eventImageRepository.Find({
      id: In(imageIds),
      event_id: eventId,
    });

    if (images.length !== imageIds.length) {
      throw new BadRequestException('Image not found');
    }

    await Promise.all(
      images.map((image) => {
        const fileKey = image.url.split('?')[0];

        return Promise.all([
          DeleteAWSFile(fileKey.substring(fileKey.lastIndexOf('/') + 1)),
          this.eventImageRepository.DeleteById(image.id, false),
        ]);
      }),
    );

    return true;
  }
}
