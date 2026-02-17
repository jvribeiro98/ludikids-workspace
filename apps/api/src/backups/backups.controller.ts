import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BackupsService } from './backups.service';

@ApiTags('Backups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('backups')
export class BackupsController {
  constructor(private backupsService: BackupsService) {}

  @Post('run')
  runBackup(@CurrentUser('tenantId') tenantId: string) {
    return this.backupsService.runBackup(tenantId);
  }

  @Get('runs')
  listRuns(@CurrentUser('tenantId') tenantId: string) {
    return this.backupsService.listRuns(tenantId);
  }
}
