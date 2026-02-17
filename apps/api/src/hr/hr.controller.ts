import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HrService } from './hr.service';
import { RoleName } from '@prisma/client';

@ApiTags('RH')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private hrService: HrService) {}

  @Post('punch')
  punch(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { staffProfileId: string; type: 'ENTRY' | 'EXIT'; latitude?: number; longitude?: number; accuracy?: number },
  ) {
    return this.hrService.punch(
      body.staffProfileId,
      body.type as any,
      body.latitude,
      body.longitude,
      body.accuracy,
      tenantId,
    );
  }

  @Get('staff')
  listStaff(@CurrentUser('tenantId') tenantId: string) {
    return this.hrService.listStaff(tenantId);
  }

  @Post('staff')
  createStaff(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { name: string; email?: string; phone?: string; hireDate?: string },
  ) {
    return this.hrService.createStaff(tenantId, body);
  }

  @Get('staff/:id/schedules')
  getSchedules(@Param('id') id: string) {
    return this.hrService.getSchedules(id);
  }

  @Post('staff/:id/schedules')
  setSchedule(
    @Param('id') id: string,
    @Body() body: { dayOfWeek: number; startTime: string; endTime: string },
  ) {
    return this.hrService.setSchedule(id, body.dayOfWeek, body.startTime, body.endTime);
  }

  @Get('report')
  @UseGuards(RolesGuard)
  @Roles(RoleName.MODERADOR, RoleName.ADMINISTRADOR)
  getMonthlyReport(
    @CurrentUser('tenantId') tenantId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.hrService.getMonthlyReport(tenantId, parseInt(year, 10), parseInt(month, 10));
  }
}
