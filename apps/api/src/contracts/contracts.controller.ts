import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@ApiTags('Contratos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@AcademicAccess()
@Controller('contracts')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Post()
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(tenantId, userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('childId') childId?: string,
  ) {
    return this.contractsService.findAll(tenantId, childId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.contractsService.findOne(tenantId, id);
  }

  @Get('child/:childId/active')
  findActiveByChild(
    @CurrentUser('tenantId') tenantId: string,
    @Param('childId') childId: string,
  ) {
    return this.contractsService.findActiveByChild(tenantId, childId);
  }

  @Put(':id')
  update(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.remove(tenantId, userId, id);
  }
}
