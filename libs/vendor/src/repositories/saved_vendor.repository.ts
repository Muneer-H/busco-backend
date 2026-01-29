import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDBParams } from '@app/common/base/base.repository';
import { SimpleRepository } from '@app/common/base/simple.repository';
import { SavedVendorModel } from '../models/saved_vendor.entity';

@Injectable()
export class SavedVendorRepository extends SimpleRepository<SavedVendorModel> {
  constructor(
    @InjectRepository(SavedVendorModel)
    private savedVendorRepository: Repository<SavedVendorModel>,
  ) {
    super(savedVendorRepository);
  }

  public async GetSavedVendors(userId: number, options?: PaginationDBParams) {
    const qb = this.Repository.createQueryBuilder('saved_vendor')
      .innerJoinAndSelect(
        'saved_vendor.vendor',
        'vendor',
        'vendor.is_deleted = false',
      )
      .leftJoinAndSelect(
        'vendor.images',
        'vendor_image',
        'vendor_image.is_thumbnail = true AND vendor_image.is_deleted = false',
      )
      .where('saved_vendor.user_id = :userId', { userId })
      .orderBy('vendor.id', 'DESC');

    if (options && options.limit != -1) {
      qb.take(options.limit).skip(options.offset);
    }

    const [savedVendors, count] = await qb.getManyAndCount();
    const vendors = savedVendors
      .map((saved) => {
        if (saved.vendor) {
          saved.vendor.is_saved = true;
        }
        return saved.vendor;
      })
      .filter((vendor) => vendor);

    return { vendors, count };
  }
}
