import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { VendorModel } from '../models/vendor.entity';

@Injectable()
export class VendorRepository extends BaseRepository<VendorModel> {
  constructor(
    @InjectRepository(VendorModel)
    private vendorRepository: Repository<VendorModel>,
  ) {
    super(vendorRepository);
  }
}

