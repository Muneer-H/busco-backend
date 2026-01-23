import { Type } from 'class-transformer';
import {
  IsBoolean,
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
  IsUUID,
} from 'class-validator';
import {
  PaginationParam,
  PaginationWithUserLocationDto,
  UserLocationDto,
} from '@app/common/base/base.dto';

class Location {
  @Matches(/^Point$/)
  type: 'Point' = 'Point';

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  coordinates: [number, number];
}

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  alt_directions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  food_type?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  location_url?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Location)
  geo_location?: Location;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operating_days?: string[];

  @IsOptional()
  @IsString()
  weekday_open_time?: string;

  @IsOptional()
  @IsString()
  weekday_close_time?: string;

  @IsOptional()
  @IsString()
  weekend_open_time?: string;

  @IsOptional()
  @IsString()
  weekend_close_time?: string;

  @IsOptional()
  @IsBoolean()
  closes_if_rain?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  neighborhood?: string;

  @IsOptional()
  @IsUUID()
  xano_id?: string;
}

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  alt_directions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  food_type?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  location_url?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Location)
  geo_location?: Location;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operating_days?: string[];

  @IsOptional()
  @IsString()
  weekday_open_time?: string;

  @IsOptional()
  @IsString()
  weekday_close_time?: string;

  @IsOptional()
  @IsString()
  weekend_open_time?: string;

  @IsOptional()
  @IsString()
  weekend_close_time?: string;

  @IsOptional()
  @IsBoolean()
  closes_if_rain?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  neighborhood?: string;

  @IsOptional()
  @IsUUID()
  xano_id?: string;
}

export class GetVendorDto extends PaginationParam {
  @IsOptional()
  @IsString()
  search_query?: string;
}

export class GetPublicVendorDto extends PaginationWithUserLocationDto {
  @IsOptional()
  @IsString()
  search_query?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  food_type?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operating_days?: string[];

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsBoolean()
  closes_if_rain?: boolean;
}

export class GetPublicVendorByIdDto extends UserLocationDto {}

export class GetSavedVendorDto extends PaginationParam {}

export class CreateVendorImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsBoolean()
  is_thumbnail?: boolean;
}

export class UpdateVendorImageDto {
  @IsOptional()
  @IsBoolean()
  is_thumbnail?: boolean;
}
