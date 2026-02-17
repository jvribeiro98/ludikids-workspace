import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    userId: string | undefined,
    dto: { categoryId: string; amount: number; date: string; description?: string; attachmentPath?: string },
  ) {
    const expense = await this.prisma.expense.create({
      data: {
        tenantId,
        categoryId: dto.categoryId,
        amount: new Decimal(dto.amount),
        date: new Date(dto.date),
        description: dto.description,
        attachmentPath: dto.attachmentPath,
      },
      include: { category: true },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Expense',
      entityId: expense.id,
      newData: { categoryId: dto.categoryId, amount: dto.amount, date: dto.date, description: dto.description },
    });
    return expense;
  }

  async findAll(tenantId: string, categoryId?: string, start?: string, end?: string) {
    const where: any = { tenantId };
    if (categoryId) where.categoryId = categoryId;
    if (start || end) {
      where.date = {};
      if (start) where.date.gte = new Date(start);
      if (end) where.date.lte = new Date(end);
    }
    return this.prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.expense.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
  }

  async update(
    tenantId: string,
    userId: string | undefined,
    id: string,
    dto: Partial<{ categoryId: string; amount: number; date: string; description: string; attachmentPath: string }>,
  ) {
    const before = await this.prisma.expense.findFirst({ where: { id, tenantId } });
    if (!before) throw new Error('Gasto não encontrado');
    const data: any = { ...dto };
    if (dto.amount !== undefined) data.amount = new Decimal(dto.amount);
    if (dto.date !== undefined) data.date = new Date(dto.date);
    const expense = await this.prisma.expense.update({
      where: { id, tenantId },
      data,
      include: { category: true },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Expense',
      entityId: id,
      oldData: { amount: Number(before.amount), date: before.date, categoryId: before.categoryId },
      newData: data,
    });
    return expense;
  }

  async remove(tenantId: string, userId: string | undefined, id: string) {
    const before = await this.prisma.expense.findFirst({ where: { id, tenantId } });
    if (!before) throw new Error('Gasto não encontrado');
    await this.prisma.expense.delete({ where: { id, tenantId } });
    await this.audit.log({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'Expense',
      entityId: id,
      oldData: { amount: Number(before.amount), date: before.date, categoryId: before.categoryId },
    });
  }

  async listCategories(tenantId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }
}
