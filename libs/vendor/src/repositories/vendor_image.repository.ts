import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { VendorImageModel } from '../models/vendor_image.entity';

@Injectable()
export class VendorImageRepository extends BaseRepository<VendorImageModel> {
  constructor(
    @InjectRepository(VendorImageModel)
    private vendorImageRepository: Repository<VendorImageModel>,
  ) {
    super(vendorImageRepository);
  }
}
