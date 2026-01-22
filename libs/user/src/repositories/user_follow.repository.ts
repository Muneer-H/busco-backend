import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimpleRepository } from '@app/common/base/simple.repository';
import { UserFollowModel } from '../models/user_follow.entity';

@Injectable()
export class UserFollowRepository extends SimpleRepository<UserFollowModel> {
  constructor(
    @InjectRepository(UserFollowModel)
    private userFollowRepository: Repository<UserFollowModel>,
  ) {
    super(userFollowRepository);
  }
}
