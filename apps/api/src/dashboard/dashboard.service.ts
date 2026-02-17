import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const cycle = await this.prisma.billingCycle.findUnique({
      where: { tenantId_year_month: { tenantId, year, month } },
    });

    let totalExpected = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let overdueCount = 0;

    if (cycle) {
      const invoices = await this.prisma.invoice.findMany({
        where: { billingCycleId: cycle.id },
      });
      totalExpected = invoices.reduce((s, i) => s + Number(i.total), 0);
      totalPaid = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
      totalPending = totalExpected - totalPaid;
      overdueCount = invoices.filter(
        (i) =>
          i.status === InvoiceStatus.OVERDUE ||
          (i.status === InvoiceStatus.PENDING && new Date(i.dueDate) < now),
      ).length;
    }

    const expenses = await this.prisma.expense.findMany({
      where: {
        tenantId,
        date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
      },
    });
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const resultMonth = totalPaid - totalExpenses;

    const alerts = await this.prisma.alert.findMany({
      where: { tenantId, readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const pendingInbox = await this.prisma.coordinationInboxItem.count({
      where: { status: 'PENDING', child: { tenantId } },
    });

    return {
      billing: { totalExpected, totalPaid, totalPending, overdueCount },
      expenses: totalExpenses,
      resultMonth,
      alerts: alerts.length,
      alertsList: alerts,
      pendingInbox,
    };
  }
}
