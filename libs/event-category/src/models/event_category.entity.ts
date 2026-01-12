import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserCategoryInterestModel } from './user_category_interest.entity';
import { EventModel } from '@app/event/models/event.entity';

@Entity('event_category')
export class EventCategory extends BaseModel {
  @Column({
    name: 'name',
    type: 'varchar',
    length: 50,
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
    name: 'icon',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  icon: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  is_active: boolean;

  @OneToMany(() => UserCategoryInterestModel, (interest) => interest.category)
  category_interests: UserCategoryInterestModel[];

  @OneToMany(() => EventModel, (event) => event.category)
  events: EventModel[];
}
