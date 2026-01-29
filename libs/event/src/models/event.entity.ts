import { BaseModel } from '@app/common/base/base.model';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Index,
  AfterLoad,
  VirtualColumn,
} from 'typeorm';
import { EventCategoryMapModel } from './event_category_map.entity';
import { EventImageModel } from './event_image.entity';
import { UserModel } from '@app/user/models/user.entity';
import type { LocationPoint } from '@app/common/types/location.type';
import {
  EventRegistrationModel,
  EventRegistrationStatus,
} from './event_registration.entity';

@Entity('event')
export class EventModel extends BaseModel {
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    name: 'location_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  location_name: string;

  @Column({
    name: 'address',
    type: 'text',
    nullable: true,
  })
  address: string;

  @Index({ spatial: true })
  @Column({
    name: 'geo_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geo_location: LocationPoint;

  @Column({
    name: 'start_time',
    type: 'timestamp',
    nullable: false,
  })
  start_time: Date;

  @Column({
    name: 'end_time',
    type: 'timestamp',
    nullable: true,
  })
  end_time: Date;

  @Column({
    name: 'allow_ads',
    type: 'boolean',
    default: false,
  })
  allow_ads: boolean;

  @Column({
    name: 'is_private',
    type: 'boolean',
    default: false,
  })
  is_private: boolean;

  @Column({
    name: 'capacity',
    type: 'int',
    nullable: true,
  })
  capacity: number;

  @Column({
    name: 'require_approval',
    type: 'boolean',
    default: false,
  })
  require_approval: boolean;

  @Column({
    name: 'city',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Index()
  city: string;

  @Column({
    name: 'host_id',
    type: 'bigint',
    nullable: true,
  })
  host_id: number;

  @Index({ unique: true })
  @Column({
    name: 'share_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  share_code: string;

  @Column({
    name: 'registration_open',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  registration_open: boolean;

  @VirtualColumn({
    type: 'integer',
    query: (alias: string) =>
      `SELECT COUNT(*) FROM saved_event se WHERE se.event_id = ${alias}.id`,
    select: false,
  })
  saved_count: number;

  @VirtualColumn({
    type: 'integer',
    query: (alias: string) =>
      `SELECT COUNT(*) FROM event_registration e ` +
      `WHERE e.event_id = ${alias}.id AND e.status = '${EventRegistrationStatus.APPROVED}' ` +
      `AND e.checked_in_at IS NOT NULL`,
    select: false,
  })
  registered_count: number;

  @OneToMany(() => EventImageModel, (image) => image.event)
  images: EventImageModel[];

  @OneToMany(() => EventCategoryMapModel, (category) => category.event)
  category_maps: EventCategoryMapModel[];

  @ManyToOne(() => UserModel, { nullable: true })
  @JoinColumn({ name: 'host_id' })
  host: UserModel;

  @OneToMany(() => EventRegistrationModel, (registration) => registration.event)
  registrations: EventRegistrationModel[];
}
