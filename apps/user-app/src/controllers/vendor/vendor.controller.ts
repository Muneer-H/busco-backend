import { VendorService } from '@app/vendor/vendor.service';
import {
  GetPublicVendorDto,
  GetSavedVendorDto,
} from '@app/vendor/dtos/vendor.dto';
import {
  Authorized,
  OptionalAuthorized,
} from '@app/common/decorators/authorized.decorator';
import {
  CurrentUser,
  OptionalCurrentUser,
} from '@app/common/decorators/current_user.decorator';
import type { IRedisUser } from '@app/user/models/user.entity';
import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserLocationDto } from '@app/common/base/base.dto';

@ApiTags('Vendor')
@Controller()
export class VendorController {
  constructor(private vendorService: VendorService) {}

  @OptionalAuthorized()
  @Get('/vendors')
  async GetPublicVendors(
    @Query() query: GetPublicVendorDto,
    @OptionalCurrentUser() actor: IRedisUser | null,
  ) {
    return await this.vendorService.GetPublicVendors(query, actor?.id);
  }

  @Authorized()
  @Get('/vendors/saved')
  async GetSavedVendors(
    @Query() query: GetSavedVendorDto,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.vendorService.GetSavedVendors(query, actor.id);
  }

  @OptionalAuthorized()
  @Get('/vendors/:id')
  async GetPublicVendorById(
    @Param('id') id: number,
    @Query() query: UserLocationDto,
    @OptionalCurrentUser() actor: IRedisUser | null,
  ) {
    return await this.vendorService.GetPublicVendorById(id, query, actor?.id);
  }

  @Authorized()
  @Post('/vendors/:id/save')
  async SaveVendor(@Param('id') id: number, @CurrentUser() actor: IRedisUser) {
    return await this.vendorService.SaveVendor(id, actor.id);
  }

  @Authorized()
  @Delete('/vendors/:id/save')
  async UnsaveVendor(
    @Param('id') id: number,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.vendorService.UnsaveVendor(id, actor.id);
  }
}
