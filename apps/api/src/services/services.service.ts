import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, name: string, basePrice: number, description?: string) {
    return this.prisma.service.create({
      data: {
        tenantId,
        name,
        basePrice: new Decimal(basePrice),
        description,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.service.findFirst({
      where: { id, tenantId },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string; basePrice?: number; description?: string }) {
    return this.prisma.service.update({
      where: { id },
      data: {
        ...data,
        ...(data.basePrice !== undefined && { basePrice: new Decimal(data.basePrice) }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.service.delete({ where: { id } });
  }
}
