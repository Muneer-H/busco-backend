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
  GetEventMapViewDto,
  GetSavedEventDto,
} from '@app/event/dtos/event.dto';
import {
  Authorized,
  OptionalAuthorized,
} from '@app/common/decorators/authorized.decorator';
import {
  CurrentUser,
  OptionalCurrentUser,
} from '@app/common/decorators/current_user.decorator';
import type { IRedisUser } from '@app/user/models/user.entity';
import { ApiFile } from '@app/common/decorators/api_file.decorator';
import { multerObj } from '@app/common/helpers/media.helper';
import { S3Prefix } from '@app/common/enums/s3_prefix.enum';
import { ImageMimeTypes } from '@app/common/constants/image_mimes_types.constant';
import { PaginationParam } from '@app/common/base/base.dto';

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

  @OptionalAuthorized()
  @Get('/events')
  async GetEvents(
    @Query() query: GetEventDto,
    @OptionalCurrentUser() actor: IRedisUser | null,
  ) {
    if (query.is_private === undefined) {
      query.is_private = false;
    }
    return await this.eventService.GetEvents(query, actor?.id);
  }

  @Authorized()
  @Get('/events/saved')
  async GetSavedEvents(
    @Query() query: GetSavedEventDto,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.GetSavedEvents(query, actor.id);
  }

  @Authorized()
  @Get('/events/hosted')
  async GetHostedEvents(
    @Query() query: PaginationParam,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.GetHostedEvents(query, actor.id);
  }

  @Authorized()
  @Get('/events/registered')
  async GetRegisteredEvents(
    @Query() query: PaginationParam,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.GetRegisteredEvents(query, actor.id);
  }

  @Authorized()
  @Get('/events/attended')
  async GetAttendedEvents(
    @Query() query: PaginationParam,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.GetAttendedEvents(query, actor.id);
  }

  @OptionalAuthorized()
  @Get('/events/map-view')
  async GetMapViewEvents(
    @Query() query: GetEventMapViewDto,
    @OptionalCurrentUser() actor: IRedisUser | null,
  ) {
    return await this.eventService.GetMapViewEvents(query, actor?.id ?? null);
  }

  @OptionalAuthorized()
  @Get('/events/by-share-code/:shareCode')
  async GetEventByShareCode(
    @Param('shareCode') shareCode: string,
    @OptionalCurrentUser() actor: IRedisUser | null,
  ) {
    return await this.eventService.GetEventByShareCode(shareCode, actor?.id);
  }

  @Authorized()
  @Post('/events/:id/save')
  async SaveEvent(@Param('id') id: number, @CurrentUser() actor: IRedisUser) {
    return await this.eventService.SaveEvent(id, actor.id);
  }

  @Authorized()
  @Post('/events/:id/register')
  async RegisterEvent(
    @Param('id') id: number,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.RegisterEvent(id, actor.id);
  }

  @Authorized()
  @Delete('/events/:id/register')
  async UnregisterEvent(
    @Param('id') id: number,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.UnregisterEventByGuest(id, actor.id);
  }

  @Authorized()
  @Delete('/events/:id/register/:userId')
  async UnregisterUserFromEvent(
    @Param('id') id: number,
    @Param('userId') userId: number,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.UnregisterUserFromEvent(
      id,
      userId,
      actor.id,
    );
  }

  @Authorized()
  @Delete('/events/:id/save')
  async UnsaveEvent(@Param('id') id: number, @CurrentUser() actor: IRedisUser) {
    return await this.eventService.UnsaveEvent(id, actor.id);
  }

  @OptionalAuthorized()
  @Get('/events/:id')
  async GetEventById(
    @Param('id') id: number,
    @OptionalCurrentUser() actor: IRedisUser | null,
  ) {
    return await this.eventService.GetEventById(id, actor?.id);
  }

  @Authorized()
  @Get('/events/:id/registrations')
  async GetEventRegistrations(
    @Param('id') id: number,
    @Query() query: PaginationParam,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.eventService.GetEventRegistrations(
      id,
      query,
      actor.id,
      false,
    );
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
