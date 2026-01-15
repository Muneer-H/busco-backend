import { BaseRepository } from '@app/common/base/base.repository';
import { SettingModel } from '../models/setting.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SettingRepository extends BaseRepository<SettingModel> {
  constructor(
    @InjectRepository(SettingModel)
    private settingRepository: Repository<SettingModel>,
  ) {
    super(settingRepository);
  }
}
