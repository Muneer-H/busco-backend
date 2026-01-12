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
  IsDate,
} from 'class-validator';
import { PaginationParam } from '@app/common/base/base.dto';

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

  @IsNumber()
  category_id: number;

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
  @IsNumber()
  start_time?: number;

  @IsNumber()
  @IsOptional()
  end_time?: number;

  @IsOptional()
  @IsNumber()
  category_id?: number;

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
}

export class GetEventDto extends PaginationParam {
  @IsOptional()
  @IsString()
  search_query?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  category_id?: number;

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @IsOptional()
  @IsNumber()
  host_id?: number;
}

export class UpdateEventImageDto {
  @IsBoolean()
  @IsOptional()
  is_thumbnail?: boolean;
}
