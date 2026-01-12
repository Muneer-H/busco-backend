import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventRepository } from './repositories/event.repository';
import { EventImageRepository } from './repositories/event_image.repository';
import { EventModel } from './models/event.entity';
import { EventImageModel } from './models/event_image.entity';
import { EventCategoryModule } from '@app/event-category/event_category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventModel, EventImageModel]),
    EventCategoryModule,
  ],
  providers: [EventService, EventRepository, EventImageRepository],
  exports: [
    EventService,
    EventRepository,
    EventImageRepository,
    EventCategoryModule,
  ],
})
export class EventModule {}
