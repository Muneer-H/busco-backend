import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventCategoryService } from './event_category.service';
import { EventCategoryRepository } from './repositories/event_category.repository';
import { UserCategoryInterestRepository } from './repositories/user_category_interest.repository';
import { EventCategory } from './models/event_category.entity';
import { UserCategoryInterestModel } from './models/user_category_interest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventCategory, UserCategoryInterestModel]),
  ],
  providers: [
    EventCategoryService,
    EventCategoryRepository,
    UserCategoryInterestRepository,
  ],
  exports: [
    EventCategoryService,
    EventCategoryRepository,
    UserCategoryInterestRepository,
  ],
})
export class EventCategoryModule {}
