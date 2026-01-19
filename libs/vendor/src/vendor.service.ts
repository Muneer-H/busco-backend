import { Injectable, BadRequestException } from '@nestjs/common';
import { VendorRepository } from './repositories/vendor.repository';
import { VendorImageRepository } from './repositories/vendor_image.repository';
import { SavedVendorRepository } from './repositories/saved_vendor.repository';
import {
  CreateVendorDto,
  UpdateVendorDto,
  GetVendorDto,
  UpdateVendorImageDto,
  GetSavedVendorDto,
} from './dtos/vendor.dto';
import { VendorModel } from './models/vendor.entity';
import { VendorImageModel } from './models/vendor_image.entity';
import { SavedVendorModel } from './models/saved_vendor.entity';
import { GetPaginationOptions } from '@app/common/helpers/misc.helper';
import { FindOptionsWhere, ILike, In } from 'typeorm';
import { DeleteAWSFile } from '@app/common/helpers/media.helper';

@Injectable()
export class VendorService {
  constructor(
    private vendorRepository: VendorRepository,
    private vendorImageRepository: VendorImageRepository,
    private savedVendorRepository: SavedVendorRepository,
  ) {}

  public async CreateVendor(
    body: CreateVendorDto,
    actorId: number,
  ): Promise<VendorModel> {
    const vendor = new VendorModel();
    Object.assign(vendor, body);
    vendor.created_by = actorId;

    const savedVendor = await this.vendorRepository.Create(vendor);

    return await this.GetVendorById(savedVendor.id);
  }

  public async GetVendors(query: GetVendorDto) {
    const options = GetPaginationOptions(query);
    const where: FindOptionsWhere<VendorModel> = {
      is_deleted: false,
    };

    if (query.search_query) {
      where.name = ILike(`%${query.search_query}%`);
    }

    const [vendors, count] = await this.vendorRepository.FindAndCount(
      where,
      options,
      ['images'],
    );

    return { vendors, count };
  }

  public async GetSavedVendors(query: GetSavedVendorDto, userId: number) {
    const options = GetPaginationOptions(query);
    return await this.savedVendorRepository.GetSavedVendors(userId, options);
  }

  public async SaveVendor(vendorId: number, userId: number) {
    const vendor = await this.vendorRepository.FindOne({
      id: vendorId,
      is_deleted: false,
    });
    if (!vendor) {
      throw new BadRequestException('Vendor not found');
    }

    const existing = await this.savedVendorRepository.FindOne({
      user_id: userId,
      vendor_id: vendorId,
    });
    if (existing) {
      return { success: true };
    }

    const savedVendor = new SavedVendorModel();
    savedVendor.user_id = userId;
    savedVendor.vendor_id = vendorId;
    await this.savedVendorRepository.Create(savedVendor);

    return { success: true };
  }

  public async UnsaveVendor(vendorId: number, userId: number) {
    const savedVendor = await this.savedVendorRepository.FindOne({
      user_id: userId,
      vendor_id: vendorId,
    });
    if (!savedVendor) {
      throw new BadRequestException('Saved vendor not found');
    }

    await this.savedVendorRepository.Delete({
      user_id: savedVendor.user_id,
      vendor_id: savedVendor.vendor_id,
    });

    return { success: true };
  }

  public async GetVendorById(id: number): Promise<VendorModel> {
    const vendor = await this.vendorRepository.FindOne(
      { id },
      { relations: ['images'] },
    );

    if (!vendor) {
      throw new BadRequestException('Vendor not found');
    }

    return vendor;
  }

  public async UpdateVendor(
    id: number,
    body: UpdateVendorDto,
    actorId: number,
  ): Promise<VendorModel> {
    await this.GetVendorById(id);

    const updateData: any = { ...body };
    updateData.updated_by = actorId;

    await this.vendorRepository.Update({ id }, updateData);

    return await this.GetVendorById(id);
  }

  public async DeleteVendor(id: number, actorId: number): Promise<boolean> {
    await this.GetVendorById(id);

    await this.vendorRepository.DeleteById(id, true);
    await this.vendorImageRepository.Update(
      { vendor_id: id },
      { is_deleted: true, updated_by: actorId },
    );

    return true;
  }

  public async UploadVendorImages(
    id: number,
    files: Express.Multer.File[],
    actorId: number,
  ): Promise<VendorImageModel[]> {
    await this.GetVendorById(id);

    const vendorImages = files.map((file) => {
      const vendorImage = new VendorImageModel();
      vendorImage.vendor_id = id;
      vendorImage.url = file['location'];
      vendorImage.is_thumbnail = false;
      vendorImage.created_by = actorId;
      return vendorImage;
    });

    return await this.vendorImageRepository.CreateAll(vendorImages);
  }

  public async UpdateVendorImage(
    vendorId: number,
    imageId: number,
    body: UpdateVendorImageDto,
    actorId: number,
  ): Promise<VendorImageModel> {
    const image = await this.vendorImageRepository.FindOne({
      id: imageId,
      vendor_id: vendorId,
    });
    if (!image) {
      throw new BadRequestException('Vendor image not found');
    }

    if (body.is_thumbnail) {
      // Unset previous cover image for this vendor
      await this.vendorImageRepository.Update(
        { vendor_id: vendorId, is_thumbnail: true },
        { is_thumbnail: false },
      );
    }

    await this.vendorImageRepository.Update(
      { id: imageId },
      { ...body, updated_by: actorId },
    );

    return await this.vendorImageRepository.FindById(imageId);
  }

  public async DeleteVendorImages(
    vendorId: number,
    imageIds: number[],
    actorId: number,
  ) {
    const images = await this.vendorImageRepository.Find({
      id: In(imageIds),
      vendor_id: vendorId,
    });

    if (images.length === 0) {
      throw new BadRequestException('Image(s) not found');
    }

    await Promise.all(
      images.map((image) => {
        const fileKey = image.url.split('?')[0];

        return Promise.all([
          DeleteAWSFile(fileKey.substring(fileKey.lastIndexOf('/') + 1)),
          this.vendorImageRepository.DeleteById(image.id, false),
        ]);
      }),
    );

    return true;
  }
}
