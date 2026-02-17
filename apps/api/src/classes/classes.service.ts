import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, name: string, description?: string) {
    return this.prisma.class.create({
      data: { tenantId, name, description },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.class.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { children: true } } },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.class.findFirst({
      where: { id, tenantId },
      include: { children: true },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string; description?: string }) {
    return this.prisma.class.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.class.delete({ where: { id } });
  }
}
