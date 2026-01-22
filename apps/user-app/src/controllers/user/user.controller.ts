import { ApiFile } from '@app/common/decorators/api_file.decorator';
import { Authorized } from '@app/common/decorators/authorized.decorator';
import { CurrentUser } from '@app/common/decorators/current_user.decorator';
import { PublicThrottle } from '@app/common/decorators/public_throttle.decorator';
import { UserService } from '@app/user/user.service';
import { EventCategoryService } from '@app/event-category/event_category.service';
import type { IRedisUser } from '@app/user/models/user.entity';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthenticateDto,
  UpdateMeDto,
  SendOtpDto,
  RefreshTokenDto,
  LogoutDto,
  UpdateCategoryInterestsDto,
} from '@app/user/dtos/user.dto';
import { S3Prefix } from '@app/common/enums/s3_prefix.enum';
import { multerObj } from '@app/common/helpers/media.helper';
import { ImageMimeTypes } from '@app/common/constants/image_mimes_types.constant';
import { EnsureFileExistsPipe } from '@app/common/pipes/ensure_file_exist.pipe';

@ApiTags('User')
@Controller()
export class UserController {
  constructor(
    private userService: UserService,
    private eventCategoryService: EventCategoryService,
  ) {}

  @Post('/user/authenticate')
  async Authenticate(@Body() body: AuthenticateDto) {
    return await this.userService.Authenticate(body);
  }

  @PublicThrottle(5, 60000)
  @Post('/user/send-otp')
  async SendOtp(@Body() body: SendOtpDto) {
    return this.userService.SendEmailVerificationCode(body.email);
  }

  @Post('/user/refresh-token')
  async RefreshToken(@Body() body: RefreshTokenDto) {
    return await this.userService.RefreshAccessToken(body.refresh_token);
  }

  @Authorized()
  @Post('/user/logout')
  async Logout(@CurrentUser() user: IRedisUser, @Body() body: LogoutDto) {
    return this.userService.Logout(body.refresh_token, user);
  }

  @Authorized()
  @Get('/user/me')
  async GetMe(@CurrentUser() user: IRedisUser) {
    return this.userService.GetMe(user);
  }

  @Authorized()
  @Get('/user/followees')
  async GetFollowees(@CurrentUser() user: IRedisUser) {
    return this.userService.GetFollowees(user.id);
  }

  @Authorized()
  @Put('/user/me')
  async UpdateMe(@CurrentUser() user: IRedisUser, @Body() body: UpdateMeDto) {
    return this.userService.UpdateMe(body, user);
  }

  @Authorized()
  @Delete('/user/me')
  async DeleteMe(@CurrentUser() user: IRedisUser) {
    return this.userService.DeleteMe(user);
  }

  @Authorized()
  @ApiFile({
    multerOptions: multerObj(S3Prefix.USER_PROFILE_IMAGE, ImageMimeTypes, true),
    description: 'User profile image',
  })
  @Post('/user/upload-profile-image')
  async UploadProfileImage(
    @CurrentUser() user: IRedisUser,
    @UploadedFile(new EnsureFileExistsPipe()) file: Express.Multer.File,
  ) {
    return this.userService.UploadProfileImage(user, file);
  }

  @Authorized()
  @Put('/user/category-interests')
  async UpdateCategoryInterests(
    @CurrentUser() user: IRedisUser,
    @Body() body: UpdateCategoryInterestsDto,
  ) {
    return this.eventCategoryService.UpdateCategoryInterests(user, body);
  }

  @Authorized()
  @Post('/user/:id/follow')
  async FollowUser(@Param('id') id: number, @CurrentUser() user: IRedisUser) {
    return this.userService.FollowUser(id, user.id);
  }

  @Authorized()
  @Delete('/user/:id/follow')
  async UnfollowUser(@Param('id') id: number, @CurrentUser() user: IRedisUser) {
    return this.userService.UnfollowUser(id, user.id);
  }

  @Get('/user/:id')
  async GetUserById(@Param('id') id: number) {
    return this.userService.GetUserById(id);
  }
}
