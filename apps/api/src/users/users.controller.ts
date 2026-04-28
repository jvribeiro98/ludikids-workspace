import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FullAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@FullAccess()
@Controller('users')
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: { sub: string; email: string; name?: string; roles: string[]; tenantId: string }) {
    return { id: user.sub, email: user.email, roles: user.roles, tenantId: user.tenantId };
  }
}
