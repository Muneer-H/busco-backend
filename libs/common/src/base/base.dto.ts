import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { IsDateGreaterThanEqual } from '../decorators/date_validator.decorator';

export class PaginationParam {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class UserLocationDto {
  @IsLatitude()
  @IsNotEmpty()
  user_lat: number;

  @IsLongitude()
  @IsNotEmpty()
  user_lng: number;
}

export class PaginationWithUserLocationDto extends PaginationParam {
  @IsLatitude()
  @IsNotEmpty()
  user_lat: number;

  @IsLongitude()
  @IsNotEmpty()
  user_lng: number;
}

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class DateRangeDto {
  @IsOptional()
  @IsDateString({ strict: true, strictSeparator: true })
  start?: string;

  @IsOptional()
  @IsDateString({ strict: true, strictSeparator: true })
  @IsDateGreaterThanEqual('start')
  end?: string;
}
