import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { EventCategory } from '../models/event_category.entity';

@Injectable()
export class EventCategoryRepository extends BaseRepository<EventCategory> {
  constructor(
    @InjectRepository(EventCategory)
    private eventCategoryRepository: Repository<EventCategory>,
  ) {
    super(eventCategoryRepository);
  }
}
