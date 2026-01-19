import { Injectable, BadRequestException } from '@nestjs/common';
import { EventRepository } from './repositories/event.repository';
import { EventImageRepository } from './repositories/event_image.repository';
import { EventCategoryRepository } from '@app/event-category/repositories/event_category.repository';
import {
  CreateEventDto,
  UpdateEventDto,
  GetEventDto,
  UpdateEventImageDto,
  GetEventMapViewDto,
} from './dtos/event.dto';
import { EventModel } from './models/event.entity';
import { EventImageModel } from './models/event_image.entity';
import {
  GetPaginationOptions,
  GenerateShortCode,
} from '@app/common/helpers/misc.helper';
import { FindOptionsWhere, ILike, In } from 'typeorm';
import { DeleteAWSFile } from '@app/common/helpers/media.helper';

@Injectable()
export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private eventImageRepository: EventImageRepository,
    private eventCategoryRepository: EventCategoryRepository,
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

  public async CreateEvent(
    body: CreateEventDto,
    actorId: number,
    isAdmin: boolean,
  ): Promise<EventModel> {
    const category = await this.eventCategoryRepository.FindById(
      body.category_id,
    );
    if (!category) {
      throw new BadRequestException('Event category not found');
    }

    const event = new EventModel();
    event.name = body.name;
    event.description = body.description;
    event.location_name = body.location_name;
    event.address = body.address;
    event.geo_location = body.geo_location;
    event.start_time = body.start_time;
    event.end_time = body.end_time;
    event.category_id = body.category_id;
    event.is_private = body.is_private ?? false;
    event.capacity = body.capacity;
    event.require_approval = body.require_approval ?? false;
    event.city = body.city.toLowerCase();
    event.created_by = actorId;
    event.host_id = isAdmin ? null : actorId;
    event.share_code = GenerateShortCode();

    const savedEvent = await this.eventRepository.Create(event);

    return await this.GetEventById(savedEvent.id);
  }

  public async GetEvents(query: GetEventDto) {
    const options = GetPaginationOptions(query);
    const where: FindOptionsWhere<EventModel> = {
      is_deleted: false,
    };

    if (query.search_query) {
      where.name = ILike(`%${query.search_query}%`);
    }

    if (query.category_id) {
      where.category_id = query.category_id;
    }

    if (query.is_private !== undefined) {
      where.is_private = query.is_private;
    }

    if (query.city) {
      where.city = query.city.toLowerCase();
    }

    if (query.host_id) {
      where.host_id = query.host_id;
    }

    const [events, count] = await this.eventRepository.FindAndCount(
      where,
      options,
      ['images', 'category', 'host'],
    );

    return { events, count };
  }

  public async GetEventById(id: number): Promise<EventModel> {
    const event = await this.eventRepository.FindOne(
      { id },
      { relations: ['images', 'category', 'host'] },
    );

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
    const event = await this.eventRepository.FindOne(
      { share_code: shareCode },
      { relations: ['images', 'category', 'host'] },
    );

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

    if (!isAdmin && event.host_id !== actorId) {
      throw new BadRequestException(
        'You are not authorized to update this event',
      );
    }

    if (body.category_id) {
      const category = await this.eventCategoryRepository.FindById(
        body.category_id,
      );
      if (!category) {
        throw new BadRequestException('Event category not found');
      }
    }

    const updateData: any = { ...body };
    updateData.updated_by = actorId;

    await this.eventRepository.Update({ id }, updateData);

    return await this.GetEventById(id);
  }

  public async CancelEvent(
    id: number,
    actorId: number,
    isAdmin: boolean,
  ): Promise<boolean> {
    const event = await this.GetEventById(id);

    if (!isAdmin && event.host_id !== actorId) {
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
    files: Express.Multer.File[],
    actorId: number,
    isAdmin: boolean,
  ): Promise<EventImageModel[]> {
    const event = await this.GetEventById(id);

    if (!isAdmin && event.host_id !== actorId) {
      throw new BadRequestException(
        'You are not authorized to upload images for this event',
      );
    }

    const eventImages = files.map((file) => {
      const eventImage = new EventImageModel();
      eventImage.event_id = id;
      eventImage.url = file['location'];
      eventImage.is_thumbnail = false;
      eventImage.created_by = actorId;
      return eventImage;
    });

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
