import { IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  value: string;
}
