import { IsOptional } from 'class-validator';

export class PaginationParam {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
