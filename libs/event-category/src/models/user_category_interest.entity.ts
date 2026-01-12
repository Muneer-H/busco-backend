import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserModel } from '@app/user/models/user.entity';
import { EventCategory } from './event_category.entity';

@Entity('user_category_interests')
export class UserCategoryInterestModel extends BaseModel {
  @Column({
    name: 'user_id',
    type: 'bigint',
    nullable: false,
  })
  user_id: number;

  @Column({
    name: 'category_id',
    type: 'bigint',
    nullable: false,
  })
  category_id: number;

  @ManyToOne(() => UserModel, (user) => user.category_interests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @ManyToOne(() => EventCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: EventCategory;
}
