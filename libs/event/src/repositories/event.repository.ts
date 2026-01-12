import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { EventModel } from '../models/event.entity';

@Injectable()
export class EventRepository extends BaseRepository<EventModel> {
  constructor(
    @InjectRepository(EventModel)
    private eventRepository: Repository<EventModel>,
  ) {
    super(eventRepository);
  }
}
