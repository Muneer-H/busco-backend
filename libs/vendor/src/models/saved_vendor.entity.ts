import { UserModel } from '@app/user/models/user.entity';
import { VendorModel } from './vendor.entity';
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('saved_vendor')
export class SavedVendorModel extends BaseEntity {
  @PrimaryColumn({
    name: 'user_id',
    type: 'bigint',
  })
  user_id: number;

  @PrimaryColumn({
    name: 'vendor_id',
    type: 'bigint',
  })
  vendor_id: number;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @ManyToOne(() => VendorModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorModel;
}
