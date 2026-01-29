import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, Index, OneToMany, VirtualColumn } from 'typeorm';
import { VendorImageModel } from './vendor_image.entity';
import type { LocationPoint } from '@app/common/types/location.type';

@Entity('vendor')
export class VendorModel extends BaseModel {
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'alt_directions',
    type: 'text',
    nullable: true,
  })
  alt_directions: string;

  @Column({
    name: 'food_type',
    type: 'text',
    array: true,
    nullable: true,
  })
  food_type: string[];

  @Column({
    name: 'location_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  location_url: string;

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
    name: 'operating_days',
    type: 'text',
    array: true,
    nullable: true,
  })
  operating_days: string[];

  @Column({
    name: 'weekday_open_time',
    type: 'time',
    nullable: true,
  })
  weekday_open_time: string;

  @Column({
    name: 'weekday_close_time',
    type: 'time',
    nullable: true,
  })
  weekday_close_time: string;

  @Column({
    name: 'weekend_open_time',
    type: 'time',
    nullable: true,
  })
  weekend_open_time: string;

  @Column({
    name: 'weekend_close_time',
    type: 'time',
    nullable: true,
  })
  weekend_close_time: string;

  @Column({
    name: 'closes_if_rain',
    type: 'boolean',
    default: false,
  })
  closes_if_rain: boolean;

  @Column({
    name: 'neighborhood',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  neighborhood: string;

  /**
   * For record purpose. No actual use.
   */
  @Column({
    name: 'xano_id',
    type: 'uuid',
    nullable: true,
  })
  xano_id: string;

  @OneToMany(() => VendorImageModel, (image) => image.vendor)
  images: VendorImageModel[];

  @VirtualColumn({
    query: (alias) =>
      `SELECT count(*) > 0 FROM "saved_vendor" WHERE "vendor_id" = ${alias}.id`,
  })
  is_saved: boolean;
}
