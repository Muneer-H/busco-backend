import { BaseModel } from '@app/common/base/base.model';
import type { LocationPoint } from '@app/common/types/location.type';
import { Column, Entity, Index, Check, OneToMany } from 'typeorm';
import { UserCategoryInterestModel } from '@app/event-category/models/user_category_interest.entity';
import { UserFollowModel } from './user_follow.entity';

export interface IRedisUser {
  id: number;
  name: string;
  firebase_uid: string;
  device_id?: number;
}

@Entity('user')
@Check('email_or_phone_check', '"email" IS NOT NULL OR "phone" IS NOT NULL')
export class UserModel extends BaseModel {
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  email: string;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone: string;

  @Column({
    name: 'image_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  image_url: string;

  @Column({
    name: 'city',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  city: string;

  @Column({
    name: 'about',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  about: string;

  @Index({ spatial: true })
  @Column({
    name: 'geo_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geo_location: LocationPoint;

  @Index({ unique: true })
  @Column({
    name: 'firebase_uid',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  firebase_uid: string;

  @Column({
    name: 'deleted_at',
    type: 'bigint',
    nullable: true,
  })
  deleted_at: number;

  @OneToMany(() => UserCategoryInterestModel, (interest) => interest.user)
  category_interests: UserCategoryInterestModel[];
}
