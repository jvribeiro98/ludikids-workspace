import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async register(
    tenantId: string,
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
    const punctualityPercent = tenant?.punctualityDiscountPercent
      ? Number(tenant.punctualityDiscountPercent)
      : 0;
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(23, 59, 59, 999);
    const isOnTime = paidAt <= dueDate && invoice.contract.punctualityDiscount;

    let discountAmount = new Decimal(invoice.discountAmount);
    if (isOnTime && punctualityPercent > 0 && !invoice.punctualityApplied) {
      const discount = new Decimal(invoice.subtotal)
        .mul(punctualityPercent)
        .div(100);
      discountAmount = discount;
    }

    const amountDec = new Decimal(amount);
    const newPaidAmount = new Decimal(invoice.paidAmount).add(amountDec);
    const total = new Decimal(invoice.subtotal).sub(discountAmount);
    const status: InvoiceStatus =
      newPaidAmount.gte(total) ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    await this.prisma.payment.create({
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
        total: total,
        status,
        punctualityApplied: isOnTime && punctualityPercent > 0,
        paidAt: status === InvoiceStatus.PAID ? paidAt : undefined,
      },
    });

    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, child: true },
    });
  }
}
