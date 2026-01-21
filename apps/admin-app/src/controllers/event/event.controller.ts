import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventService } from '@app/event/event.service';
import {
  CreateEventDto,
  UpdateEventDto,
  GetEventDto,
  UpdateEventImageDto,
} from '@app/event/dtos/event.dto';
import { Authorized } from '@app/common/decorators/authorized.decorator';
import { CurrentUser } from '@app/common/decorators/current_user.decorator';
import type { IRedisAdmin } from '@app/admin/models/admin.entity';
import { ApiFile } from '@app/common/decorators/api_file.decorator';
import { multerObj } from '@app/common/helpers/media.helper';
import { S3Prefix } from '@app/common/enums/s3_prefix.enum';
import { ImageMimeTypes } from '@app/common/constants/image_mimes_types.constant';
import { EnsureFileExistsPipe } from '@app/common/pipes/ensure_file_exist.pipe';

@ApiTags('Event')
@Controller()
export class EventController {
  constructor(private eventService: EventService) {}

  @Authorized()
  @Post('/events')
  async CreateEvent(
    @Body() body: CreateEventDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.eventService.CreateEvent(body, actor.id, true);
  }

  @Authorized()
  @Get('/events')
  async GetEvents(@Query() query: GetEventDto) {
    return await this.eventService.GetEvents(query);
  }

  @Authorized()
  @Get('/events/:id')
  async GetEventById(@Param('id') id: number) {
    return await this.eventService.GetEventById(id);
  }

  @Authorized()
  @Put('/events/:id')
  async UpdateEvent(
    @Param('id') id: number,
    @Body() body: UpdateEventDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.eventService.UpdateEvent(id, body, actor.id, true);
  }

  @Authorized()
  @Delete('/events/:id')
  async CancelEvent(
    @Param('id') id: number,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.eventService.CancelEvent(id, actor.id, true);
  }

  @Authorized()
  @ApiFile({
    multerOptions: multerObj(S3Prefix.EVENT_IMAGE, ImageMimeTypes, true),
    description: 'Event images',
    fields: [
      { name: 'thumbnail', maxCount: 1, required: false },
      { name: 'images', maxCount: 10, required: false },
    ],
  })
  @Post('/events/:id/images')
  async UploadEventImages(
    @Param('id') id: number,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.eventService.UploadEventImages(id, files, actor.id, true);
  }

  @Authorized()
  @Put('/events/:id/images/:imageId')
  async UpdateEventImage(
    @Param('id') eventId: number,
    @Param('imageId') imageId: number,
    @Body() body: UpdateEventImageDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.eventService.UpdateEventImage(
      eventId,
      imageId,
      body,
      actor.id,
      true,
    );
  }

  @Authorized()
  @Delete('/events/:id/images/:imageId')
  async DeleteEventImage(
    @Param('id') eventId: number,
    @Param('imageId') imageId: number,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.eventService.DeleteEventImage(
      eventId,
      [imageId],
      actor.id,
      true,
    );
  }
}
