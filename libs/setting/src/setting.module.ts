import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';

@Module({
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
