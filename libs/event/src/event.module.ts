import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventRepository } from './repositories/event.repository';
import { EventImageRepository } from './repositories/event_image.repository';
import { SavedEventRepository } from './repositories/saved_event.repository';
import { EventCategoryMapRepository } from './repositories/event_category_map.repository';
import { EventRegistrationRepository } from './repositories/event_registration.repository';
import { EventModel } from './models/event.entity';
import { EventImageModel } from './models/event_image.entity';
import { SavedEventModel } from './models/saved_event.entity';
import { EventCategoryMapModel } from './models/event_category_map.entity';
import { EventRegistrationModel } from './models/event_registration.entity';
import { EventCategoryModule } from '@app/event-category/event_category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventModel,
      EventImageModel,
      SavedEventModel,
      EventCategoryMapModel,
      EventRegistrationModel,
    ]),
    EventCategoryModule,
  ],
  providers: [
    EventService,
    EventRepository,
    EventImageRepository,
    SavedEventRepository,
    EventCategoryMapRepository,
    EventRegistrationRepository,
  ],
  exports: [
    EventService,
    EventRepository,
    EventImageRepository,
    SavedEventRepository,
    EventCategoryMapRepository,
    EventRegistrationRepository,
    EventCategoryModule,
  ],
})
export class EventModule {}
