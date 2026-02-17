import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: { categoryId: string; amount: number; date: string; description?: string; attachmentPath?: string }) {
    return this.prisma.expense.create({
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

  async update(tenantId: string, id: string, dto: Partial<{ categoryId: string; amount: number; date: string; description: string; attachmentPath: string }>) {
    const data: any = { ...dto };
    if (dto.amount !== undefined) data.amount = new Decimal(dto.amount);
    if (dto.date !== undefined) data.date = new Date(dto.date);
    return this.prisma.expense.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  async listCategories(tenantId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }
}
