import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { EventImageModel } from '../models/event_image.entity';

@Injectable()
export class EventImageRepository extends BaseRepository<EventImageModel> {
  constructor(
    @InjectRepository(EventImageModel)
    private eventImageRepository: Repository<EventImageModel>,
  ) {
    super(eventImageRepository);
  }
}
