import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/role/roles.guard';
import { Roles } from 'src/modules/auth/role/roles.decorator';

export function AdminOnly() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('ADMIN'),
  );
}
