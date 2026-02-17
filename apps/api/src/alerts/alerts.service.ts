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

    // Gastos: variação por categoria (média 3 meses)
    const threeMonthsAgo = new Date(year, month - 4, 1);
    const categories = await this.prisma.expenseCategory.findMany({
      where: { tenantId },
    });
    for (const cat of categories) {
      const current = await this.prisma.expense.aggregate({
        where: { categoryId: cat.id, date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } },
        _sum: { amount: true },
      });
      const previous = await this.prisma.expense.aggregate({
        where: { categoryId: cat.id, date: { gte: threeMonthsAgo } },
        _sum: { amount: true },
        _count: true,
      });
      const currentSum = Number(current._sum.amount ?? 0);
      const avgPrevious = previous._count > 0 ? Number(previous._sum.amount ?? 0) / 3 : 0;
      if (avgPrevious > 0 && currentSum > avgPrevious * 1.2) {
        const pct = Math.round(((currentSum - avgPrevious) / avgPrevious) * 100);
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
