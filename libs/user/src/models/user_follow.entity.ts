import { UserModel } from '@app/user/models/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Index('IDX_user_follow_follower', ['follower_id'])
@Index('IDX_user_follow_followee', ['followee_id'])
@Entity('user_follow')
export class UserFollowModel extends BaseEntity {
  @PrimaryColumn({
    name: 'follower_id',
    type: 'bigint',
  })
  follower_id: number;

  @PrimaryColumn({
    name: 'followee_id',
    type: 'bigint',
  })
  followee_id: number;

  @Column({
    name: 'followed_at',
    type: 'bigint',
    default: () => '((EXTRACT(epoch FROM now()) * (1000)))',
  })
  followed_at: number;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'follower_id',
    foreignKeyConstraintName: 'FK_user_follow_follower',
  })
  follower: UserModel;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'followee_id',
    foreignKeyConstraintName: 'FK_user_follow_followee',
  })
  followee: UserModel;
}
