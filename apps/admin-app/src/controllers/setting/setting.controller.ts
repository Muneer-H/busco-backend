import { Authorized } from '@app/common/decorators/authorized.decorator';
import { UpdateSettingsDto } from '@app/setting/dtos/settings.dto';
import { SettingService } from '@app/setting/setting.service';
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Settings')
@Controller()
export class SettingsController {
  constructor(private settingsService: SettingService) {}

  @Get('settings/')
  @Authorized()
  public async GetSettings() {
    return this.settingsService.GetAllSettings();
  }

  @Put('settings/:id')
  @Authorized()
  public async UpdateSettings(
    @Param('id') id: number,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.settingsService.UpdateSettings(id, body);
  }
}
