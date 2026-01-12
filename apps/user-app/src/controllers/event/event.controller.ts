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
import type { IRedisUser } from '@app/user/models/user.entity';
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
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.CreateEvent(body, actor.id, false);
  }

  @Get('/events')
  async GetEvents(@Query() query: GetEventDto) {
    if (query.is_private === undefined) {
      query.is_private = false;
    }
    return await this.eventService.GetEvents(query);
  }

  @Get('/events/by-share-code/:shareCode')
  async GetEventByShareCode(@Param('shareCode') shareCode: string) {
    return await this.eventService.GetEventByShareCode(shareCode);
  }

  @Get('/events/:id')
  async GetEventById(@Param('id') id: number) {
    return await this.eventService.GetEventById(id);
  }

  @Authorized()
  @ApiFile({
    multerOptions: multerObj(S3Prefix.EVENT_IMAGE, ImageMimeTypes, true),
    description: 'Event images',
    fieldName: 'images',
    isArray: true,
  })
  @Post('/events/:id/images')
  async UploadEventImages(
    @Param('id') id: number,
    @UploadedFiles(new EnsureFileExistsPipe()) files: Express.Multer.File[],
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.UploadEventImages(
      id,
      files,
      actor.id,
      false,
    );
  }

  @Authorized()
  @Put('/events/:id/images/:imageId')
  async UpdateEventImage(
    @Param('id') eventId: number,
    @Param('imageId') imageId: number,
    @Body() body: UpdateEventImageDto,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.UpdateEventImage(
      eventId,
      imageId,
      body,
      actor.id,
      false,
    );
  }

  @Authorized()
  @Put('/events/:id')
  async UpdateEvent(
    @Param('id') id: number,
    @Body() body: UpdateEventDto,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.UpdateEvent(id, body, actor.id, false);
  }

  @Authorized()
  @Delete('/events/:id/images/:imageId')
  async DeleteEventImage(
    @Param('id') eventId: number,
    @Param('imageId') imageId: number,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.DeleteEventImage(
      eventId,
      [imageId],
      actor.id,
      false,
    );
  }

  @Authorized()
  @Delete('/events/:id')
  async CancelEvent(@Param('id') id: number, @CurrentUser() actor: IRedisUser) {
    return await this.eventService.CancelEvent(id, actor.id, false);
  }
}
