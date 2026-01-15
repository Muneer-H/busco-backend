import { PublicThrottle } from '@app/common/decorators/public_throttle.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { SettingService } from '@app/setting/setting.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Setting')
@Controller()
export class SettingController {
  constructor(private settingService: SettingService) {}

  @PublicThrottle()
  @Get('setting')
  public async GetAllSettings() {
    return this.settingService.GetAllSettings();
  }

  @PublicThrottle()
  @Get('setting/:key')
  public async GetSetting(@Param('key') key: string) {
    return this.settingService.GetSetting(key);
  }
}
