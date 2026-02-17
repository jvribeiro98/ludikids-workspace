import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async generateAlerts(tenantId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Inadimplência
    const overdue = await this.prisma.invoice.count({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
        dueDate: { lt: now },
      },
    });
    if (overdue > 0) {
      const existing = await this.prisma.alert.findFirst({
        where: {
          tenantId,
          type: 'OVERDUE_INVOICES',
          createdAt: { gte: new Date(year, month - 1, 1) },
        },
      });
      if (!existing) {
        await this.prisma.alert.create({
          data: {
            tenantId,
            type: 'OVERDUE_INVOICES',
            title: 'Mensalidades em atraso',
            message: `${overdue} fatura(s) em atraso causando prejuízo.`,
            metadata: { count: overdue },
          },
        });
      }
    }

    // Gastos: variação por categoria — média real dos últimos 3 meses (cada mês separado)
    const spikeThresholdPct = 20;
    const categories = await this.prisma.expenseCategory.findMany({
      where: { tenantId },
    });
    for (const cat of categories) {
      const [currentAgg, agg1, agg2, agg3] = await Promise.all([
        this.prisma.expense.aggregate({
          where: { categoryId: cat.id, date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { categoryId: cat.id, date: { gte: new Date(year, month - 2, 1), lt: new Date(year, month - 1, 1) } },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { categoryId: cat.id, date: { gte: new Date(year, month - 3, 1), lt: new Date(year, month - 2, 1) } },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { categoryId: cat.id, date: { gte: new Date(year, month - 4, 1), lt: new Date(year, month - 3, 1) } },
          _sum: { amount: true },
        }),
      ]);
      const currentSum = Number(currentAgg._sum.amount ?? 0);
      const m1 = Number(agg1._sum.amount ?? 0);
      const m2 = Number(agg2._sum.amount ?? 0);
      const m3 = Number(agg3._sum.amount ?? 0);
      const monthsWithValue = [m1, m2, m3].filter((v) => v > 0).length;
      const avgPrevious = (m1 + m2 + m3) / 3;

      if (
        monthsWithValue >= 2 &&
        avgPrevious > 0 &&
        currentSum > avgPrevious * (1 + spikeThresholdPct / 100)
      ) {
        const pct = Math.round(((currentSum - avgPrevious) / avgPrevious) * 100);
        const existing = await this.prisma.alert.findFirst({
          where: {
            tenantId,
            type: 'EXPENSE_SPIKE',
            createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
            metadata: { path: ['categoryId'], equals: cat.id },
          },
        });
        if (!existing) {
          await this.prisma.alert.create({
            data: {
              tenantId,
              type: 'EXPENSE_SPIKE',
              title: `Gasto da categoria ${cat.name} subiu`,
              message: `Gasto de ${cat.name} subiu ${pct}% em relação à média dos últimos 3 meses.`,
              metadata: { categoryId: cat.id, categoryName: cat.name, percent: pct },
            },
          });
        }
      }
    }

    return { ok: true };
  }

  async list(tenantId: string, unreadOnly = false) {
    const where: any = { tenantId };
    if (unreadOnly) where.readAt = null;
    return this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(tenantId: string, id: string) {
    return this.prisma.alert.updateMany({
      where: { id, tenantId },
      data: { readAt: new Date() },
    });
  }
}
