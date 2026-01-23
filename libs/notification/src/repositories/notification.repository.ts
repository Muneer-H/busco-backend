import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationModel } from '../models/notification.entity';
import { BaseRepository } from '@app/common/base/base.repository';

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationModel> {
  constructor(
    @InjectRepository(NotificationModel)
    private readonly notificationRepository: Repository<NotificationModel>,
  ) {
    super(notificationRepository);
  }
}
