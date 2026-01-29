import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { OptionalAuthGuard } from '../guards/optional_auth.guard';

export function Authorized(...roles: any[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard),
    ApiBearerAuth(),
  );
}

export function OptionalAuthorized(...roles: any[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(OptionalAuthGuard),
    ApiOperation({ security: [{}, { bearer: [] }] }),
  );
}
