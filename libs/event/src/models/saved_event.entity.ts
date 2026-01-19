import { UserModel } from '@app/user/models/user.entity';
import { EventModel } from './event.entity';
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('saved_event')
export class SavedEventModel extends BaseEntity {
  @PrimaryColumn({
    name: 'user_id',
    type: 'bigint',
  })
  user_id: number;

  @PrimaryColumn({
    name: 'event_id',
    type: 'bigint',
  })
  event_id: number;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @ManyToOne(() => EventModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventModel;
}
