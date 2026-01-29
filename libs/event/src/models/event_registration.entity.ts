import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { EventModel } from './event.entity';
import { UserModel } from '@app/user/models/user.entity';

export enum EventRegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('event_registration')
export class EventRegistrationModel extends BaseEntity {
  @PrimaryColumn({
    name: 'event_id',
    type: 'bigint',
  })
  event_id: number;

  @PrimaryColumn({
    name: 'user_id',
    type: 'bigint',
  })
  user_id: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 50,
    nullable: false,
    default: EventRegistrationStatus.PENDING,
  })
  status: EventRegistrationStatus;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @Column({
    name: 'checked_in_at',
    type: 'timestamp',
    nullable: true,
  })
  checked_in_at: Date | null;

  @ManyToOne(() => EventModel, (event) => event.registrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: EventModel;

  @ManyToOne(() => UserModel, (user) => user.registrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserModel;
}
