import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
  ValidateNested,
  Length,
  IsBoolean,
} from 'class-validator';

class Location {
  @Matches(/^Point$/)
  type: 'Point' = 'Point';

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  coordinates: [number, number];
}

export class AuthenticateDto {
  @IsString()
  @IsOptional()
  id_token?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  otp_code?: string;

  @IsNumber()
  @IsOptional()
  device_id?: number;
}

export class SendOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  about?: string;

  @IsOptional()
  @IsBoolean()
  signup_completed?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => Location)
  geo_location?: Location;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

export class LogoutDto {
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

export class UpdateCategoryInterestsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  category_ids: number[];
}
