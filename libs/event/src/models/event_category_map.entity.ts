import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { EventModel } from './event.entity';
import { EventCategory } from '@app/event-category/models/event_category.entity';

@Index('IDX_event_category_map_primary', ['event_id'], {
  unique: true,
  where: '"is_primary" = true',
})
@Entity('event_category_map')
export class EventCategoryMapModel extends BaseEntity {
  @PrimaryColumn({
    name: 'event_id',
    type: 'bigint',
  })
  event_id: number;

  @PrimaryColumn({
    name: 'category_id',
    type: 'bigint',
  })
  category_id: number;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  is_primary: boolean;

  @ManyToOne(() => EventModel, (event) => event.category_maps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'event_id',
    foreignKeyConstraintName: 'FK_event_category_map_event',
  })
  event: EventModel;

  @ManyToOne(() => EventCategory, (category) => category.event_categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'category_id',
    foreignKeyConstraintName: 'FK_event_category_map_category',
  })
  category: EventCategory;
}
