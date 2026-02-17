import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { calcLateFeeAndInterest } from './billing-calc';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getOrCreateBillingCycle(tenantId: string, year: number, month: number) {
    let cycle = await this.prisma.billingCycle.findUnique({
      where: { tenantId_year_month: { tenantId, year, month } },
    });
    if (!cycle) {
      cycle = await this.prisma.billingCycle.create({
        data: { tenantId, year, month },
      });
    }
    return cycle;
  }

  async generateInvoices(tenantId: string, year: number, month: number, userId?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new Error('Tenant não encontrado');

    const cycle = await this.getOrCreateBillingCycle(tenantId, year, month);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const contracts = await this.prisma.contract.findMany({
      where: {
        tenantId,
        startDate: { lte: endOfMonth },
        OR: [{ endDate: null }, { endDate: { gte: startOfMonth } }],
      },
      include: {
        child: true,
        contractServices: { include: { service: true } },
      },
    });

    const created: string[] = [];
    for (const contract of contracts) {
      const existing = await this.prisma.invoice.findUnique({
        where: {
          billingCycleId_childId: { billingCycleId: cycle.id, childId: contract.childId },
        },
      });
      if (existing) continue;

      const dueDate = new Date(year, month - 1, Math.min(contract.dueDay, 28));
      let subtotal = new Decimal(0);
      const items: { serviceId: string; description: string; quantity: number; unitPrice: Decimal; total: Decimal }[] = [];

      for (const cs of contract.contractServices) {
        const qty = 1;
        const total = new Decimal(cs.unitPrice).mul(qty);
        subtotal = subtotal.add(total);
        items.push({
          serviceId: cs.serviceId,
          description: cs.service.name,
          quantity: qty,
          unitPrice: cs.unitPrice,
          total,
        });
      }

      const discountAmount = new Decimal(0);
      const lateFeeAmount = new Decimal(0);
      const interestAmount = new Decimal(0);
      const total = subtotal.sub(discountAmount).add(lateFeeAmount).add(interestAmount);

      await this.prisma.invoice.create({
        data: {
          tenantId,
          billingCycleId: cycle.id,
          childId: contract.childId,
          contractId: contract.id,
          dueDate,
          status: InvoiceStatus.PENDING,
          subtotal,
          discountAmount,
          lateFeeAmount,
          interestAmount,
          total,
          items: {
            create: items,
          },
        },
      });
      created.push(contract.childId);
    }

    await this.audit.log({
      tenantId,
      userId,
      action: 'BILLING_GENERATE',
      entity: 'BillingCycle',
      entityId: cycle.id,
      newData: { year, month, createdCount: created.length },
    });

    return { cycleId: cycle.id, created: created.length, message: `${created.length} faturas geradas.` };
  }

  async listInvoices(tenantId: string, billingCycleId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId, billingCycleId },
      include: {
        child: true,
        items: { include: { service: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getMonthlySummary(tenantId: string, year: number, month: number) {
    const cycle = await this.prisma.billingCycle.findUnique({
      where: { tenantId_year_month: { tenantId, year, month } },
    });
    if (!cycle) return { totalExpected: 0, totalPaid: 0, totalPending: 0, overdueCount: 0 };

    const invoices = await this.prisma.invoice.findMany({
      where: { billingCycleId: cycle.id },
    });
    const totalExpected = invoices.reduce((s, i) => s + Number(i.total), 0);
    const totalPaid = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
    const totalPending = totalExpected - totalPaid;
    const overdueCount = invoices.filter(
      (i) => i.status === InvoiceStatus.OVERDUE || (i.status === InvoiceStatus.PENDING && new Date(i.dueDate) < new Date()),
    ).length;

    return { totalExpected, totalPaid, totalPending, overdueCount };
  }

  async updateOverdueInvoicesForTenant(tenantId: string): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return 0;
    const now = new Date();
    const pending = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.PENDING] },
        dueDate: { lt: now },
      },
    });
    let updated = 0;
    for (const inv of pending) {
      const { lateFeeAmount, interestAmount } = calcLateFeeAndInterest(
        inv.subtotal,
        inv.dueDate,
        now,
        {
          lateFeePercent: tenant.lateFeePercent,
          interestPercentPerMonth: tenant.interestPercentPerMonth,
          lateFeeMaxPercent: tenant.lateFeeMaxPercent,
        },
      );
      const total = new Decimal(inv.subtotal)
        .sub(inv.discountAmount)
        .add(lateFeeAmount)
        .add(interestAmount);
      await this.prisma.invoice.update({
        where: { id: inv.id },
        data: {
          status: InvoiceStatus.OVERDUE,
          lateFeeAmount,
          interestAmount,
          total,
        },
      });
      updated++;
    }
    return updated;
  }

  async getOverdueReport(tenantId: string, referenceMonth?: string) {
    const ref = referenceMonth ? new Date(referenceMonth) : new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
        dueDate: { lt: ref },
      },
      include: { child: true },
      orderBy: { dueDate: 'asc' },
    });
    const byMonth = new Map<string, number>();
    for (const inv of invoices) {
      const key = `${inv.dueDate.getFullYear()}-${String(inv.dueDate.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    }
    return { invoices, byMonth: Object.fromEntries(byMonth) };
  }
}
