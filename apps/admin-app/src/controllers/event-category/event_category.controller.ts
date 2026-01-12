import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventCategoryService } from '@app/event-category/event_category.service';
import {
  CreateEventCategoryDto,
  UpdateEventCategoryDto,
  GetEventCategoryDto,
} from '@app/event-category/dtos/event_category.dto';
import { Authorized } from '@app/common/decorators/authorized.decorator';
import { CurrentUser } from '@app/common/decorators/current_user.decorator';
import type { IRedisAdmin } from '@app/admin/models/admin.entity';
import { ApiFile } from '@app/common/decorators/api_file.decorator';
import { multerObj } from '@app/common/helpers/media.helper';
import { S3Prefix } from '@app/common/enums/s3_prefix.enum';
import { ImageMimeTypes } from '@app/common/constants/image_mimes_types.constant';
import { EnsureFileExistsPipe } from '@app/common/pipes/ensure_file_exist.pipe';

@ApiTags('Event Category')
@Controller()
export class EventCategoryController {
  constructor(private eventCategoryService: EventCategoryService) {}

  @Authorized()
  @Post('/event-categories')
  async CreateEventCategory(
    @Body() body: CreateEventCategoryDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.eventCategoryService.CreateEventCategory(body, actor);
  }

  @Authorized()
  @Get('/event-categories')
  async GetEventCategories(@Query() query: GetEventCategoryDto) {
    return await this.eventCategoryService.GetEventCategories(query);
  }

  @Authorized()
  @Get('/event-categories/:id')
  async GetEventCategoryById(@Param('id') id: number) {
    return await this.eventCategoryService.GetEventCategoryById(id);
  }

  @Authorized()
  @Put('/event-categories/:id')
  async UpdateEventCategory(
    @Param('id') id: number,
    @Body() body: UpdateEventCategoryDto,
  ) {
    return await this.eventCategoryService.UpdateEventCategory(id, body);
  }

  @Authorized()
  @Delete('/event-categories/:id')
  async DeleteEventCategory(@Param('id') id: number) {
    return await this.eventCategoryService.DeleteEventCategory(id);
  }

  @Authorized()
  @ApiFile({
    multerOptions: multerObj(
      S3Prefix.EVENT_CATEGORY_ICON,
      ImageMimeTypes,
      true,
    ),
    description: 'Event category icon',
  })
  @Post('/event-categories/:id/upload-icon')
  async UploadEventCategoryIcon(
    @Param('id') id: number,
    @UploadedFile(new EnsureFileExistsPipe()) file: Express.Multer.File,
  ) {
    return await this.eventCategoryService.UploadEventCategoryIcon(id, file);
  }
}
