import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, Index } from 'typeorm';

export enum NotificationType {
  WELCOME = 'welcome',
}

export interface INotificationBody {
  en: string;
}

export interface INotificationTitle {
  en: string;
}

@Entity('notification')
@Index(['user_id', 'created_at', 'is_deleted'])
@Index(['user_id', 'is_read', 'is_deleted'])
@Index(['notification_type', 'created_at'])
export class NotificationModel extends BaseModel {
  @Column({
    name: 'notification_message',
    type: 'jsonb',
    nullable: false,
  })
  notification_message: INotificationBody;

  @Column({
    name: 'notification_title',
    type: 'jsonb',
    nullable: true,
  })
  notification_title: INotificationTitle;

  @Column({
    name: 'notification_type',
    type: 'varchar',
    nullable: false,
  })
  notification_type: NotificationType;

  @Column({
    name: 'user_id',
    type: 'bigint',
    nullable: false,
  })
  user_id: number;

  @Column({
    name: 'additional_info',
    type: 'jsonb',
    nullable: true,
  })
  additional_info: Record<string, any>;

  @Column({
    name: 'is_read',
    type: 'boolean',
    default: false,
  })
  is_read: boolean;

  @Column({
    name: 'read_at',
    type: 'bigint',
    nullable: true,
  })
  read_at: number;
}
