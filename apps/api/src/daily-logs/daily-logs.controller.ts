import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DailyLogsService } from './daily-logs.service';

@ApiTags('Diário')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@AcademicAccess()
@Controller('daily-logs')
export class DailyLogsController {
  constructor(private dailyLogsService: DailyLogsService) {}

  @Get('class/:classId')
  getByClassAndDate(
    @Param('classId') classId: string,
    @Query('date') date: string,
  ) {
    return this.dailyLogsService.getOrCreateDailyLog(classId, date || new Date().toISOString().slice(0, 10));
  }

  @Put('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() body: { bath?: boolean; feeding?: string; sleepMinutes?: number; snack?: string; observations?: string },
  ) {
    return this.dailyLogsService.updateItem(id, body);
  }

  @Post('items/:id/incidents')
  addIncident(
    @Param('id') id: string,
    @Body() body: { description: string; severity?: string },
  ) {
    return this.dailyLogsService.addIncident(id, body.description, body.severity);
  }

  @Post('items/:id/send-to-coordination')
  sendToCoordination(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() body: { childId: string },
  ) {
    return this.dailyLogsService.sendToCoordination(tenantId, id, body.childId);
  }
}
