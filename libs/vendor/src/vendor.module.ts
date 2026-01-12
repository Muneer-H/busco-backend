import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorService } from './vendor.service';
import { VendorModel } from './models/vendor.entity';
import { VendorImageModel } from './models/vendor_image.entity';
import { VendorRepository } from './repositories/vendor.repository';
import { VendorImageRepository } from './repositories/vendor_image.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VendorModel, VendorImageModel])],
  providers: [VendorService, VendorRepository, VendorImageRepository],
  exports: [VendorService, VendorRepository, VendorImageRepository],
})
export class VendorModule {}
