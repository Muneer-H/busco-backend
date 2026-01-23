import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceModel } from '../models/device.entity';
import { BaseRepository } from '@app/common/base/base.repository';

@Injectable()
export class DeviceRepository extends BaseRepository<DeviceModel> {
  constructor(
    @InjectRepository(DeviceModel)
    private readonly deviceRepository: Repository<DeviceModel>,
  ) {
    super(deviceRepository);
  }
}
