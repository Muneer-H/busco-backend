import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EventModel } from './event.entity';

@Entity('event_image')
export class EventImageModel extends BaseModel {
  @Column({
    name: 'event_id',
    type: 'bigint',
    nullable: false,
  })
  event_id: number;

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

  @ManyToOne(() => EventModel, (event) => event.images)
  @JoinColumn({ name: 'event_id' })
  event: EventModel;
}
