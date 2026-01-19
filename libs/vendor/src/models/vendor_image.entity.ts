import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { VendorModel } from './vendor.entity';

@Entity('vendor_image')
export class VendorImageModel extends BaseModel {
  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: false,
  })
  vendor_id: number;

  @Column({
    name: 'url',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  url: string;

  @Column({
    name: 'is_thumbnail',
    type: 'boolean',
    default: false,
  })
  is_thumbnail: boolean;

  @ManyToOne(() => VendorModel, (vendor) => vendor.images)
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorModel;
}
