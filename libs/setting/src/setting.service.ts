import { BadRequestException, Injectable } from '@nestjs/common';
import { SettingRepository } from './repositories/setting.repository';
import { UpdateSettingsDto } from './dtos/settings.dto';

@Injectable()
export class SettingService {
  constructor(private settingRepository: SettingRepository) {}

  public async GetSetting(key: string) {
    return this.settingRepository.FindOne({ key });
  }

  public async GetAllSettings() {
    return this.settingRepository.Find({});
  }

  public async UpdateSettings(id: number, data: UpdateSettingsDto) {
    const settings = await this.settingRepository.FindOne({ id });
    if (!settings) {
      throw new BadRequestException('Settings not found');
    }
    await this.settingRepository.Update({ id: settings.id }, data);
    return {
      ...settings,
      value: data.value,
    };
  }
}
