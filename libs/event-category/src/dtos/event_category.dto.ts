import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PaginationParam } from '@app/common/base/base.dto';

export class CreateEventCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsOptional()
  @Length(1, 1024)
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateEventCategoryDto {
  @IsString()
  @IsOptional()
  @Length(1, 50)
  name?: string;

  @IsString()
  @IsOptional()
  @Length(1, 500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class GetEventCategoryDto extends PaginationParam {
  @IsOptional()
  @IsString()
  search_query?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
