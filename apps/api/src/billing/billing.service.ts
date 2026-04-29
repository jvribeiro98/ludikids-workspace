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
    const buildSummary = async (refYear: number, refMonth: number) => {
      const cycle = await this.prisma.billingCycle.findUnique({
        where: { tenantId_year_month: { tenantId, year: refYear, month: refMonth } },
      });
      if (!cycle) {
        return {
          totalExpected: 0,
          totalPaid: 0,
          totalPending: 0,
          overdueCount: 0,
          expenseTotal: 0,
          activeChildren: 0,
          costPerChild: 0,
        };
      }

      const invoices = await this.prisma.invoice.findMany({
        where: { billingCycleId: cycle.id },
      });

      const totalExpected = invoices.reduce((s, i) => s + Number(i.total), 0);
      const totalPaid = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
      const totalPending = totalExpected - totalPaid;
      const overdueCount = invoices.filter(
        (i) => i.status === InvoiceStatus.OVERDUE || (i.status === InvoiceStatus.PENDING && new Date(i.dueDate) < new Date()),
      ).length;

      const monthStart = new Date(refYear, refMonth - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(refYear, refMonth, 0, 23, 59, 59, 999);

      const expenses = await this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          tenantId,
          date: { gte: monthStart, lte: monthEnd },
        },
      });

      const activeContracts = await this.prisma.contract.findMany({
        where: {
          tenantId,
          startDate: { lte: monthEnd },
          OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
        },
        select: { childId: true },
        distinct: ['childId'],
      });

      const expenseTotal = Number(expenses._sum.amount || 0);
      const activeChildren = activeContracts.length;
      const costPerChild = activeChildren > 0 ? expenseTotal / activeChildren : 0;

      return { totalExpected, totalPaid, totalPending, overdueCount, expenseTotal, activeChildren, costPerChild };
    };

    const current = await buildSummary(year, month);

    const previousDate = new Date(year, month - 2, 1);
    const previous = await buildSummary(previousDate.getFullYear(), previousDate.getMonth() + 1);

    const comparison = {
      expectedDelta: current.totalExpected - previous.totalExpected,
      paidDelta: current.totalPaid - previous.totalPaid,
      pendingDelta: current.totalPending - previous.totalPending,
      overdueDelta: current.overdueCount - previous.overdueCount,
      expenseDelta: current.expenseTotal - previous.expenseTotal,
      costPerChildDelta: current.costPerChild - previous.costPerChild,
    };

    return {
      ...current,
      previous,
      comparison,
    };
  }

  /**
   * Recalcula multa/juros e marca como OVERDUE as faturas vencidas não pagas.
   * Idempotente: multa 1x, juros proporcional aos dias; rodar todo dia não infla valores.
   * Inclui PENDING e OVERDUE (recalcula juros diário).
   */
  async updateOverdueInvoicesForTenant(tenantId: string): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return 0;
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
        dueDate: { lt: now },
      },
    });
    let updated = 0;
    for (const inv of invoices) {
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

      const oldData = {
        status: inv.status,
        lateFeeAmount: Number(inv.lateFeeAmount),
        interestAmount: Number(inv.interestAmount),
        total: Number(inv.total),
      };
      const newData = {
        status: 'OVERDUE' as const,
        lateFeeAmount: Number(lateFeeAmount),
        interestAmount: Number(interestAmount),
        total: Number(total),
      };

      await this.prisma.invoice.update({
        where: { id: inv.id },
        data: {
          status: InvoiceStatus.OVERDUE,
          lateFeeAmount,
          interestAmount,
          total,
        },
      });
      await this.audit.log({
        tenantId,
        userId: undefined,
        action: 'SYSTEM_UPDATE_OVERDUE',
        entity: 'Invoice',
        entityId: inv.id,
        oldData,
        newData,
      });
      updated++;
    }
    return updated;
  }

  async getReconciliationReport(tenantId: string, year: number, month: number) {
    const cycle = await this.prisma.billingCycle.findUnique({
      where: { tenantId_year_month: { tenantId, year, month } },
    });

    if (!cycle) {
      return {
        summary: {
          totalInvoices: 0,
          expectedTotal: 0,
          invoicePaidTotal: 0,
          paymentsTotal: 0,
          paidVsPaymentsDelta: 0,
          divergentCount: 0,
        },
        divergentInvoices: [],
        invoices: [],
      };
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, billingCycleId: cycle.id },
      include: {
        child: true,
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const parsedInvoices = invoices.map((inv) => {
      const expected = Number(inv.total);
      const invoicePaid = Number(inv.paidAmount);
      const paymentsTotal = inv.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
      const delta = Number((invoicePaid - paymentsTotal).toFixed(2));

      return {
        invoiceId: inv.id,
        childId: inv.childId,
        childName: inv.child?.name ?? '',
        status: inv.status,
        dueDate: inv.dueDate,
        expected,
        invoicePaid,
        paymentsTotal,
        delta,
        paymentCount: inv.payments.length,
      };
    });

    const expectedTotal = parsedInvoices.reduce((sum, i) => sum + i.expected, 0);
    const invoicePaidTotal = parsedInvoices.reduce((sum, i) => sum + i.invoicePaid, 0);
    const paymentsTotal = parsedInvoices.reduce((sum, i) => sum + i.paymentsTotal, 0);
    const paidVsPaymentsDelta = Number((invoicePaidTotal - paymentsTotal).toFixed(2));

    const divergentInvoices = parsedInvoices.filter((i) => Math.abs(i.delta) >= 0.01);

    return {
      summary: {
        totalInvoices: parsedInvoices.length,
        expectedTotal,
        invoicePaidTotal,
        paymentsTotal,
        paidVsPaymentsDelta,
        divergentCount: divergentInvoices.length,
      },
      divergentInvoices,
      invoices: parsedInvoices,
    };
  }

  async reconcileInvoice(tenantId: string, invoiceId: string, userId?: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

    const previousPaidAmount = Number(invoice.paidAmount);
    const paymentsTotal = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const reconciledPaidAmount = Number(paymentsTotal.toFixed(2));
    const total = Number(invoice.total);

    const status =
      reconciledPaidAmount >= total
        ? InvoiceStatus.PAID
        : reconciledPaidAmount > 0
          ? InvoiceStatus.PARTIAL
          : new Date(invoice.dueDate) < new Date()
            ? InvoiceStatus.OVERDUE
            : InvoiceStatus.PENDING;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: reconciledPaidAmount,
        status,
        paidAt: status === InvoiceStatus.PAID ? invoice.paidAt || new Date() : null,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'BILLING_RECONCILE_INVOICE',
      entity: 'Invoice',
      entityId: invoiceId,
      oldData: {
        paidAmount: previousPaidAmount,
        status: invoice.status,
      },
      newData: {
        paidAmount: reconciledPaidAmount,
        status,
      },
    });

    return {
      invoiceId,
      previousPaidAmount,
      reconciledPaidAmount,
      deltaApplied: Number((reconciledPaidAmount - previousPaidAmount).toFixed(2)),
      status,
    };
  }

  async reconcileDivergentInvoices(tenantId: string, year: number, month: number, userId?: string) {
    const cycle = await this.prisma.billingCycle.findUnique({
      where: { tenantId_year_month: { tenantId, year, month } },
    });

    if (!cycle) {
      return {
        year,
        month,
        totalInvoices: 0,
        divergentCount: 0,
        reconciledCount: 0,
        unchangedCount: 0,
        totalDeltaApplied: 0,
        reconciledInvoices: [],
      };
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, billingCycleId: cycle.id },
      include: { payments: true },
      orderBy: { dueDate: 'asc' },
    });

    let totalDeltaApplied = 0;
    const reconciledInvoices: Array<{
      invoiceId: string;
      previousPaidAmount: number;
      reconciledPaidAmount: number;
      deltaApplied: number;
      status: InvoiceStatus;
    }> = [];

    for (const invoice of invoices) {
      const previousPaidAmount = Number(invoice.paidAmount);
      const paymentsTotal = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const reconciledPaidAmount = Number(paymentsTotal.toFixed(2));
      const deltaApplied = Number((reconciledPaidAmount - previousPaidAmount).toFixed(2));

      if (Math.abs(deltaApplied) < 0.01) {
        continue;
      }

      const total = Number(invoice.total);
      const status =
        reconciledPaidAmount >= total
          ? InvoiceStatus.PAID
          : reconciledPaidAmount > 0
            ? InvoiceStatus.PARTIAL
            : new Date(invoice.dueDate) < new Date()
              ? InvoiceStatus.OVERDUE
              : InvoiceStatus.PENDING;

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: reconciledPaidAmount,
          status,
          paidAt: status === InvoiceStatus.PAID ? invoice.paidAt || new Date() : null,
        },
      });

      await this.audit.log({
        tenantId,
        userId,
        action: 'BILLING_RECONCILE_INVOICE',
        entity: 'Invoice',
        entityId: invoice.id,
        oldData: {
          paidAmount: previousPaidAmount,
          status: invoice.status,
        },
        newData: {
          paidAmount: reconciledPaidAmount,
          status,
        },
      });

      totalDeltaApplied += deltaApplied;
      reconciledInvoices.push({
        invoiceId: invoice.id,
        previousPaidAmount,
        reconciledPaidAmount,
        deltaApplied,
        status,
      });
    }

    return {
      year,
      month,
      totalInvoices: invoices.length,
      divergentCount: reconciledInvoices.length,
      reconciledCount: reconciledInvoices.length,
      unchangedCount: invoices.length - reconciledInvoices.length,
      totalDeltaApplied: Number(totalDeltaApplied.toFixed(2)),
      reconciledInvoices,
    };
  }

  async getReconciliationHistory(tenantId: string, year: number, month: number, limit = 20) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        action: 'BILLING_RECONCILE_INVOICE',
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      userId: log.userId,
      invoiceId: log.entityId,
      oldData: log.oldData,
      newData: log.newData,
    }));
  }

  async getOverdueReport(tenantId: string, referenceMonth?: string) {
    const ref = referenceMonth ? new Date(referenceMonth) : new Date();
    const refYear = ref.getFullYear();
    const refMonth = ref.getMonth();
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
    const invoicesWithMonths = invoices.map((inv) => {
      const dueYear = new Date(inv.dueDate).getFullYear();
      const dueMonth = new Date(inv.dueDate).getMonth();
      const monthsOverdue = (refYear - dueYear) * 12 + (refMonth - dueMonth);
      const key = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
      return {
        ...inv,
        monthsOverdue: Math.max(0, monthsOverdue),
      };
    });
    const byChild = new Map<
      string,
      { childId: string; childName: string; monthsOverdue: number; totalOverdue: number }
    >();
    for (const inv of invoicesWithMonths) {
      const cur = byChild.get(inv.childId);
      const totalRemaining = Number(inv.total) - Number(inv.paidAmount);
      const monthsOverdue = (inv as { monthsOverdue?: number }).monthsOverdue ?? 0;
      if (!cur) {
        byChild.set(inv.childId, {
          childId: inv.childId,
          childName: inv.child?.name ?? '',
          monthsOverdue,
          totalOverdue: Math.max(0, totalRemaining),
        });
      } else {
        cur.monthsOverdue = Math.max(cur.monthsOverdue, monthsOverdue);
        cur.totalOverdue += Math.max(0, totalRemaining);
      }
    }
    return {
      invoices: invoicesWithMonths,
      byMonth: Object.fromEntries(byMonth),
      byChild: Array.from(byChild.values()),
    };
  }
}
