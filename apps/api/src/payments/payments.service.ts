import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { calcLateFeeAndInterest } from '../billing/billing-calc';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private mapAsaasBillingTypeToMethod(billingType?: string) {
    switch ((billingType || '').toUpperCase()) {
      case 'PIX':
        return 'PIX';
      case 'BOLETO':
        return 'BOLETO';
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return 'CARD';
      case 'BANK_TRANSFER':
      case 'TRANSFER':
        return 'TRANSFER';
      default:
        return 'OTHER';
    }
  }

  async processAsaasWebhook(payload: any) {
    if (payload?.event !== 'PAYMENT_RECEIVED') {
      return { processed: false, reason: 'event_not_supported' as const };
    }

    const eventId = payload?.id;
    const payment = payload?.payment || {};
    const invoiceId = payment?.externalReference;

    if (!eventId || !invoiceId) {
      return { processed: false, reason: 'missing_required_data' as const };
    }

    const duplicated = await this.prisma.payment.findFirst({
      where: { reference: eventId },
      select: { id: true },
    });

    if (duplicated) {
      return { processed: false, reason: 'duplicate_event' as const };
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId },
      select: { id: true, tenantId: true },
    });

    if (!invoice) {
      return { processed: false, reason: 'invoice_not_found' as const };
    }

    const amount = Number(payment?.value || 0);
    const paidAt = payment?.paymentDate ? new Date(payment.paymentDate) : new Date();
    const method = this.mapAsaasBillingTypeToMethod(payment?.billingType);

    await this.register(
      invoice.tenantId,
      undefined,
      invoice.id,
      amount,
      method,
      paidAt,
      eventId,
      `Asaas paymentId=${payment?.id || 'unknown'}`,
    );

    return { processed: true, invoiceId: invoice.id };
  }

  async register(
    tenantId: string,
    userId: string | undefined,
    invoiceId: string,
    amount: number,
    method: string,
    paidAt: Date,
    reference?: string,
    notes?: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { contract: true },
    });
    if (!invoice) throw new Error('Fatura não encontrada');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    const punctualityPercent =
      tenant?.punctualityDiscountPercent != null ? Number(tenant.punctualityDiscountPercent) : 0;
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(23, 59, 59, 999);
    const isOnTime = paidAt <= dueDate && invoice.contract.punctualityDiscount;

    let discountAmount = new Decimal(invoice.discountAmount);
    if (isOnTime && punctualityPercent > 0 && !invoice.punctualityApplied) {
      discountAmount = new Decimal(invoice.subtotal).mul(punctualityPercent).div(100);
    }

    let lateFeeAmount = new Decimal(invoice.lateFeeAmount);
    let interestAmount = new Decimal(invoice.interestAmount);
    if (paidAt > dueDate && tenant) {
      const calc = calcLateFeeAndInterest(
        invoice.subtotal,
        invoice.dueDate,
        paidAt,
        {
          lateFeePercent: tenant.lateFeePercent,
          interestPercentPerMonth: tenant.interestPercentPerMonth,
          lateFeeMaxPercent: tenant.lateFeeMaxPercent,
        },
      );
      lateFeeAmount = calc.lateFeeAmount;
      interestAmount = calc.interestAmount;
    }

    const total = new Decimal(invoice.subtotal)
      .sub(discountAmount)
      .add(lateFeeAmount)
      .add(interestAmount);
    const amountDec = new Decimal(amount);
    const newPaidAmount = new Decimal(invoice.paidAmount).add(amountDec);
    const status: InvoiceStatus =
      newPaidAmount.gte(total) ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: amountDec,
        method: method as any,
        paidAt,
        reference,
        notes,
      },
    });

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        discountAmount,
        lateFeeAmount,
        interestAmount,
        total,
        status,
        punctualityApplied: isOnTime && punctualityPercent > 0,
        paidAt: status === InvoiceStatus.PAID ? paidAt : undefined,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      newData: {
        invoiceId,
        amount: Number(amountDec),
        method,
        paidAt: paidAt.toISOString(),
        reference,
        notes,
      },
    });

    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, child: true },
    });
  }
}
