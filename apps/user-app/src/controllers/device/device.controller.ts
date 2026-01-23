import { DeviceService } from '@app/device/device.service';
import {
  RegisterDeviceDto,
  UpdateDeviceDto,
} from '@app/device/dtos/device.dto';
import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Devices')
@Controller()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post('device/register')
  async RegisterDevice(@Body() registerDeviceDto: RegisterDeviceDto) {
    return await this.deviceService.RegisterDevice(registerDeviceDto);
  }

  @Put('device/:id')
  async UpdateDevice(
    @Param('id') deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return await this.deviceService.UpdateDevice(+deviceId, updateDeviceDto);
  }
}
