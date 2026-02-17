import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';

@ApiTags('Contratos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Post()
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(tenantId, dto);
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
}
