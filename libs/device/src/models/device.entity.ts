import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, Index } from 'typeorm';

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export interface IDeviceToken {
  id: number;
  iat: number;
  sending_attempts: 0;
  last_sending_attempt_at: number | null;
}

@Entity('device')
@Index(['firebase_token', 'is_deleted'])
@Index(['owner_id', 'is_deleted'])
export class DeviceModel extends BaseModel {
  @Column({
    name: 'firebase_token',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  firebase_token: string;

  @Column({
    name: 'device_type',
    type: 'enum',
    enum: DeviceType,
    nullable: false,
  })
  device_type: DeviceType;

  @Column({
    name: 'owner_id',
    type: 'bigint',
    nullable: true,
  })
  owner_id: number;

  @Column({
    name: 'device_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  device_name: string;

  @Column({
    name: 'device_model',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  device_model: string;

  @Column({
    name: 'os_version',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  os_version: string;

  @Column({
    name: 'app_version',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  app_version: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  is_active: boolean;

  @Column({
    name: 'last_active_at',
    type: 'bigint',
    nullable: true,
  })
  last_active_at: number;

  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  timezone: string;

  @Column({
    name: 'user_agent',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  user_agent: string;
}
