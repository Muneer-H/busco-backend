import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { UserCategoryInterestModel } from '../models/user_category_interest.entity';

@Injectable()
export class UserCategoryInterestRepository extends BaseRepository<UserCategoryInterestModel> {
  constructor(
    @InjectRepository(UserCategoryInterestModel)
    private userCategoryInterestRepository: Repository<UserCategoryInterestModel>,
  ) {
    super(userCategoryInterestRepository);
  }
}
