import { VendorService } from '@app/vendor/vendor.service';
import {
  GetPublicVendorByIdDto,
  GetPublicVendorDto,
  GetSavedVendorDto,
} from '@app/vendor/dtos/vendor.dto';
import { Authorized } from '@app/common/decorators/authorized.decorator';
import { CurrentUser } from '@app/common/decorators/current_user.decorator';
import type { IRedisUser } from '@app/user/models/user.entity';
import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Vendor')
@Controller()
export class VendorController {
  constructor(private vendorService: VendorService) {}

  @Get('/vendors')
  async GetPublicVendors(@Query() query: GetPublicVendorDto) {
    return await this.vendorService.GetPublicVendors(query);
  }

  @Get('/vendors/:id')
  async GetPublicVendorById(
    @Param('id') id: number,
    @Query() query: GetPublicVendorByIdDto,
  ) {
    return await this.vendorService.GetPublicVendorById(id, query);
  }

  @Authorized()
  @Get('/vendors/saved')
  async GetSavedVendors(
    @Query() query: GetSavedVendorDto,
    @CurrentUser() actor: IRedisUser,
  ) {
    return await this.vendorService.GetSavedVendors(query, actor.id);
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
