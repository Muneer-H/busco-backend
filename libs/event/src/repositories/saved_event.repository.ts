import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDBParams } from '@app/common/base/base.repository';
import { SimpleRepository } from '@app/common/base/simple.repository';
import { SavedEventModel } from '../models/saved_event.entity';

@Injectable()
export class SavedEventRepository extends SimpleRepository<SavedEventModel> {
  constructor(
    @InjectRepository(SavedEventModel)
    private savedEventRepository: Repository<SavedEventModel>,
  ) {
    super(savedEventRepository);
  }

  public async GetSavedEvents(userId: number, options?: PaginationDBParams) {
    const qb = this.Repository.createQueryBuilder('saved_event')
      .innerJoinAndSelect(
        'saved_event.event',
        'event',
        'event.is_deleted = false',
      )
      .leftJoinAndSelect(
        'event.images',
        'event_image',
        'event_image.is_thumbnail = true AND event_image.is_deleted = false',
      )
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.host', 'host')
      .where('saved_event.user_id = :userId', { userId })
      .orderBy('event.id', 'DESC');

    if (options && options.limit != -1) {
      qb.take(options.limit).skip(options.offset);
    }

    const [savedEvents, count] = await qb.getManyAndCount();
    const events = savedEvents
      .map((saved) => saved.event)
      .filter((event) => event);

    return { events, count };
  }
}
