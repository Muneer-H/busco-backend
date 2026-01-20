import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorService } from './vendor.service';
import { VendorModel } from './models/vendor.entity';
import { VendorImageModel } from './models/vendor_image.entity';
import { SavedVendorModel } from './models/saved_vendor.entity';
import { VendorRepository } from './repositories/vendor.repository';
import { VendorImageRepository } from './repositories/vendor_image.repository';
import { SavedVendorRepository } from './repositories/saved_vendor.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorModel, VendorImageModel, SavedVendorModel]),
  ],
  providers: [
    VendorService,
    VendorRepository,
    VendorImageRepository,
    SavedVendorRepository,
  ],
  exports: [
    VendorService,
    VendorRepository,
    VendorImageRepository,
    SavedVendorRepository,
  ],
})
export class VendorModule {}
