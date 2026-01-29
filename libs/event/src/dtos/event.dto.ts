import { Transform, Type } from 'class-transformer';
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
  IsDate,
  IsLatitude,
  IsLongitude,
  IsInt,
  Min,
} from 'class-validator';
import { DateRangeDto, PaginationParam } from '@app/common/base/base.dto';

class Location {
  @Matches(/^Point$/)
  type: 'Point' = 'Point';

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  coordinates: [number, number];
}

export class CreateEventDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  location_name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Location)
  geo_location?: Location;

  @IsOptional()
  @IsDate()
  start_time?: Date;

  @IsOptional()
  @IsDate()
  end_time?: Date;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  category_ids: number[];

  @IsOptional()
  @IsInt()
  primary_category_id?: number;

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @IsOptional()
  @IsBoolean()
  registration_open?: boolean;
}

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  location_name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Location)
  geo_location?: Location;

  @IsOptional()
  @IsDate()
  start_time?: Date;

  @IsOptional()
  @IsDate()
  end_time?: Date;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  category_ids?: number[];

  @IsOptional()
  @IsInt()
  primary_category_id?: number;

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.toLowerCase())
  city?: string;

  @IsOptional()
  @IsBoolean()
  registration_open?: boolean;
}

export class GetEventDto extends PaginationParam {
  @IsOptional()
  @IsString()
  search_query?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  category_ids?: number[];

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @IsOptional()
  @IsNumber()
  host_id?: number;

  @IsOptional()
  @IsLatitude()
  user_lat?: number;

  @IsOptional()
  @IsLongitude()
  user_lng?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  date_range?: DateRangeDto;
}

export class GetSavedEventDto extends PaginationParam {}

export class GetEventMapViewDto {
  @IsLatitude()
  @IsNotEmpty()
  sw_lat: number;

  @IsLongitude()
  @IsNotEmpty()
  sw_lng: number;

  @IsLatitude()
  @IsNotEmpty()
  ne_lat: number;

  @IsLongitude()
  @IsNotEmpty()
  ne_lng: number;

  @IsOptional()
  @IsNumber()
  zoom?: number;

  @IsOptional()
  @IsLatitude()
  user_lat?: number;

  @IsOptional()
  @IsLongitude()
  user_lng?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  category_ids?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  date_range?: DateRangeDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_distance?: number; // in meters
}

export class UpdateEventImageDto {
  @IsBoolean()
  @IsOptional()
  is_thumbnail?: boolean;
}
