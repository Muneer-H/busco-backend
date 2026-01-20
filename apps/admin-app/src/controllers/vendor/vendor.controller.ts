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
import { VendorService } from '@app/vendor/vendor.service';
import {
  CreateVendorDto,
  UpdateVendorDto,
  GetVendorDto,
  UpdateVendorImageDto,
} from '@app/vendor/dtos/vendor.dto';
import { Authorized } from '@app/common/decorators/authorized.decorator';
import { CurrentUser } from '@app/common/decorators/current_user.decorator';
import type { IRedisAdmin } from '@app/admin/models/admin.entity';
import { ApiFile } from '@app/common/decorators/api_file.decorator';
import { multerObj } from '@app/common/helpers/media.helper';
import { S3Prefix } from '@app/common/enums/s3_prefix.enum';
import { ImageMimeTypes } from '@app/common/constants/image_mimes_types.constant';
import { EnsureFileExistsPipe } from '@app/common/pipes/ensure_file_exist.pipe';

@ApiTags('Vendor')
@Controller()
export class VendorController {
  constructor(private vendorService: VendorService) {}

  @Authorized()
  @Post('/vendors')
  async CreateVendor(
    @Body() body: CreateVendorDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.vendorService.CreateVendor(body, actor.id);
  }

  @Authorized()
  @Get('/vendors')
  async GetVendors(@Query() query: GetVendorDto) {
    return await this.vendorService.GetVendors(query);
  }

  @Authorized()
  @Get('/vendors/:id')
  async GetVendorById(@Param('id') id: number) {
    return await this.vendorService.GetVendorById(id);
  }

  @Authorized()
  @Put('/vendors/:id')
  async UpdateVendor(
    @Param('id') id: number,
    @Body() body: UpdateVendorDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.vendorService.UpdateVendor(id, body, actor.id);
  }

  @Authorized()
  @Delete('/vendors/:id')
  async DeleteVendor(
    @Param('id') id: number,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.vendorService.DeleteVendor(id, actor.id);
  }

  @Authorized()
  @ApiFile({
    multerOptions: multerObj(S3Prefix.VENDOR_IMAGE, ImageMimeTypes, true),
    description: 'Vendor images',
    fieldName: 'images',
    isArray: true,
  })
  @Post('/vendors/:id/images')
  async UploadVendorImages(
    @Param('id') id: number,
    @UploadedFiles(new EnsureFileExistsPipe()) files: Express.Multer.File[],
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.vendorService.UploadVendorImages(id, files, actor.id);
  }

  @Authorized()
  @Put('/vendors/:id/images/:imageId')
  async UpdateVendorImage(
    @Param('id') vendorId: number,
    @Param('imageId') imageId: number,
    @Body() body: UpdateVendorImageDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.vendorService.UpdateVendorImage(
      vendorId,
      imageId,
      body,
      actor.id,
    );
  }

  @Authorized()
  @Delete('/vendors/:id/images/:imageId')
  async DeleteVendorImage(
    @Param('id') vendorId: number,
    @Param('imageId') imageId: number,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.vendorService.DeleteVendorImages(
      vendorId,
      [imageId],
      actor.id,
    );
  }
}
