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
