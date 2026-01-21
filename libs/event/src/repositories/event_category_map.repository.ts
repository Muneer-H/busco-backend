import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimpleRepository } from '@app/common/base/simple.repository';
import { EventCategoryMapModel } from '../models/event_category_map.entity';

@Injectable()
export class EventCategoryMapRepository extends SimpleRepository<EventCategoryMapModel> {
  constructor(
    @InjectRepository(EventCategoryMapModel)
    private eventCategoryMapRepository: Repository<EventCategoryMapModel>,
  ) {
    super(eventCategoryMapRepository);
  }
}
