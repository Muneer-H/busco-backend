import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventCategoryService } from '@app/event-category/event_category.service';
import { GetEventCategoryDto } from '@app/event-category/dtos/event_category.dto';

@ApiTags('Event Category')
@Controller()
export class EventCategoryController {
  constructor(private eventCategoryService: EventCategoryService) {}

  @Get('/event-categories')
  async GetEventCategories(@Query() query: GetEventCategoryDto) {
    query.is_active = true;
    return await this.eventCategoryService.GetEventCategories(query);
  }
}
