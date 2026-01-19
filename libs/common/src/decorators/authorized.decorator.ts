import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
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
    ApiBearerAuth(),
  );
}
