import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinancialAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillingService } from './billing.service';

@ApiTags('Faturamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@FinancialAccess()
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('generate')
  generateInvoices(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { year: number; month: number },
  ) {
    return this.billingService.generateInvoices(tenantId, body.year, body.month, userId);
  }

  @Get('cycles')
  getOrCreateCycle(
    @CurrentUser('tenantId') tenantId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.billingService.getOrCreateBillingCycle(
      tenantId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('invoices')
  listInvoices(
    @CurrentUser('tenantId') tenantId: string,
    @Query('billingCycleId') billingCycleId: string,
  ) {
    return this.billingService.listInvoices(tenantId, billingCycleId);
  }

  @Get('summary')
  getSummary(
    @CurrentUser('tenantId') tenantId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.billingService.getMonthlySummary(
      tenantId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('overdue')
  getOverdue(
    @CurrentUser('tenantId') tenantId: string,
    @Query('referenceMonth') referenceMonth?: string,
  ) {
    return this.billingService.getOverdueReport(tenantId, referenceMonth);
  }

  @Get('reconciliation')
  getReconciliation(
    @CurrentUser('tenantId') tenantId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.billingService.getReconciliationReport(
      tenantId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('reconciliation/history')
  getReconciliationHistory(
    @CurrentUser('tenantId') tenantId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.getReconciliationHistory(
      tenantId,
      parseInt(year, 10),
      parseInt(month, 10),
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('reconciliation/reconcile-invoice')
  reconcileInvoice(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { invoiceId: string },
  ) {
    return this.billingService.reconcileInvoice(tenantId, body.invoiceId, userId);
  }

  @Post('reconciliation/reconcile-all')
  reconcileAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { year: number; month: number },
  ) {
    return this.billingService.reconcileDivergentInvoices(tenantId, body.year, body.month, userId);
  }
}
