import { Injectable, BadRequestException } from '@nestjs/common';
import { EventCategoryRepository } from './repositories/event_category.repository';
import { UserCategoryInterestRepository } from './repositories/user_category_interest.repository';
import {
  CreateEventCategoryDto,
  UpdateEventCategoryDto,
  GetEventCategoryDto,
} from './dtos/event_category.dto';
import { EventCategory } from './models/event_category.entity';
import { UserCategoryInterestModel } from './models/user_category_interest.entity';
import { GetPaginationOptions } from '@app/common/helpers/misc.helper';
import { ILike, In } from 'typeorm';
import { IRedisAdmin } from '@app/admin/models/admin.entity';
import { IRedisUser } from '@app/user/models/user.entity';
import { UpdateCategoryInterestsDto } from '@app/user/dtos/user.dto';
import {
  DeleteAWSFile,
  GetAWSSignedUrl,
} from '@app/common/helpers/media.helper';

@Injectable()
export class EventCategoryService {
  constructor(
    private eventCategoryRepository: EventCategoryRepository,
    private userCategoryInterestRepository: UserCategoryInterestRepository,
  ) {}

  public async CreateEventCategory(
    body: CreateEventCategoryDto,
    actor: IRedisAdmin,
  ): Promise<EventCategory> {
    const existing = await this.eventCategoryRepository.FindOne({
      name: body.name,
    });

    if (existing) {
      throw new BadRequestException(
        'Event category with this name already exists',
      );
    }

    const category = new EventCategory();
    category.name = body.name;
    category.description = body.description;
    category.is_active = body.is_active ?? true;
    category.created_by = actor.id;

    return await this.eventCategoryRepository.Create(category);
  }

  public async GetEventCategories(query: GetEventCategoryDto) {
    const options = GetPaginationOptions(query);
    const where: any = {};

    if (query.search_query) {
      where.name = ILike(`%${query.search_query}%`);
    }

    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    const [categories, count] = await this.eventCategoryRepository.FindAndCount(
      where,
      options,
    );
    return { categories, count };
  }

  public async GetEventCategoryById(id: number): Promise<EventCategory> {
    const category = await this.eventCategoryRepository.FindById(id);

    if (!category) {
      throw new BadRequestException('Event category not found');
    }

    return category;
  }

  public async UpdateEventCategory(
    id: number,
    body: UpdateEventCategoryDto,
  ): Promise<EventCategory> {
    const category = await this.GetEventCategoryById(id);

    if (body.name && body.name !== category.name) {
      const existing = await this.eventCategoryRepository.FindOne({
        name: body.name,
      });
      if (existing) {
        throw new BadRequestException(
          'Event category with this name already exists',
        );
      }
    }

    await this.eventCategoryRepository.Update({ id }, body);

    return await this.GetEventCategoryById(id);
  }

  public async DeleteEventCategory(id: number): Promise<boolean> {
    await this.GetEventCategoryById(id);
    await this.eventCategoryRepository.DeleteById(id);
    return true;
  }

  public async UploadEventCategoryIcon(id: number, file: Express.Multer.File) {
    const category = await this.GetEventCategoryById(id);

    if (category.icon) {
      const fileKey = category.icon.split('?')[0];
      await DeleteAWSFile(fileKey.substring(fileKey.lastIndexOf('/') + 1));
    }

    await this.eventCategoryRepository.Update(
      { id: category.id },
      { icon: file['location'] },
    );

    const iconUrl = await GetAWSSignedUrl(file['location']);
    return {
      icon: iconUrl,
    };
  }

  public async UpdateCategoryInterests(
    user: IRedisUser,
    body: UpdateCategoryInterestsDto,
  ) {
    if (body.category_ids.length) {
      const uniqueCategoryIds = [...new Set(body.category_ids)];
      const categoriesCount = await this.eventCategoryRepository.Count({
        id: In(uniqueCategoryIds),
        is_active: true,
      });

      if (categoriesCount !== uniqueCategoryIds.length) {
        throw new BadRequestException('One or more categories are invalid');
      }
    }

    const existingInterests = await this.userCategoryInterestRepository.Find({
      user_id: user.id,
    });

    const existingCategoryIds = new Set(
      existingInterests.map((i) => +i.category_id),
    );
    const newCategoryIds = new Set(body.category_ids);

    const toAdd = body.category_ids.filter(
      (id) => !existingCategoryIds.has(id),
    );
    const toRemove = existingInterests.filter(
      (i) => !newCategoryIds.has(+i.category_id),
    );

    let removePromise: Promise<any>;
    let addPromise: Promise<any>;
    if (toRemove.length) {
      removePromise = this.userCategoryInterestRepository.Delete(
        {
          id: In(toRemove.map((i) => i.id)),
        },
        false,
      );
    }

    if (toAdd.length) {
      const categoryInterests = toAdd.map((categoryId) => {
        const interest = new UserCategoryInterestModel();
        interest.user_id = user.id;
        interest.category_id = categoryId;
        return interest;
      });
      addPromise =
        this.userCategoryInterestRepository.CreateAll(categoryInterests);
    }

    await Promise.all([removePromise, addPromise]);

    return { success: true };
  }
}
