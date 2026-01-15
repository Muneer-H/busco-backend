import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingModel } from './models/setting.entity';
import { SettingRepository } from './repositories/setting.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SettingModel])],
  providers: [SettingService, SettingRepository],
  exports: [SettingService, SettingRepository],
})
export class SettingModule {}
