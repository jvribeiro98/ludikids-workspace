import { Body, Controller, Headers, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinancialAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Pagamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@FinancialAccess()
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    const paidAt = new Date();
    return this.paymentsService.register(
      tenantId,
      userId,
      dto.invoiceId,
      dto.amount,
      dto.method,
      paidAt,
      dto.reference,
      dto.notes,
    );
  }

  @Public()
  @Post('webhooks/asaas')
  receiveAsaasWebhook(
    @Headers('x-webhook-token') token: string | undefined,
    @Body() payload: any,
  ) {
    const expected = process.env.ASAAS_WEBHOOK_TOKEN;
    if (expected && token !== expected) {
      throw new UnauthorizedException('Invalid webhook token');
    }

    return this.paymentsService.processAsaasWebhook(payload);
  }
}
