import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { UserModel } from '../models/user.entity';
import { UserFollowModel } from '../models/user_follow.entity';

@Injectable()
export class UserRepository extends BaseRepository<UserModel> {
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {
    super(userRepository);
  }

  public async GetFollowees(userId: number) {
    const [followees, count] = await this.Repository.createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.image_url', 'user.about'])
      .innerJoin(
        UserFollowModel,
        'user_follow',
        'user_follow.follower_id = user.id AND user_follow.follower_id = :userId',
        { userId: userId },
      )
      .where('user.is_deleted = false')
      .orderBy('user_follow.followed_at', 'DESC')
      .getManyAndCount();

    return { followees, count };
  }
}
