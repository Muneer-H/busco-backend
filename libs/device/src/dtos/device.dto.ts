import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { DeviceType } from '../models/device.entity';

class BaseDeviceDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  firebase_token?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  os_version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  app_version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  user_agent?: string;
}

export class RegisterDeviceDto extends BaseDeviceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  user_id?: string;

  @IsNotEmpty()
  @IsEnum(DeviceType)
  device_type: DeviceType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  device_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  device_model?: string;
}

export class UpdateDeviceDto extends BaseDeviceDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
