import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModel } from './models/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { CommonModule } from '@app/common/common.module';
import { DeviceModule } from '@app/device/device.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationModel]),
    DeviceModule,
    CommonModule,
  ],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
