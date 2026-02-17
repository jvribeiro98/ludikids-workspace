import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateContractDto) {
    const contract = await this.prisma.contract.create({
      data: {
        tenantId,
        childId: dto.childId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        dueDay: dto.dueDay,
        punctualityDiscount: dto.punctualityDiscount ?? true,
        siblingDiscount: dto.siblingDiscount ?? false,
        siblingCount: dto.siblingCount ?? 0,
        notes: dto.notes,
        contractServices: {
          create: dto.services.map((s) => ({
            serviceId: s.serviceId,
            unitPrice: new Decimal(s.unitPrice),
          })),
        },
      },
      include: { contractServices: { include: { service: true } }, child: true },
    });
    return contract;
  }

  async findAll(tenantId: string, childId?: string) {
    return this.prisma.contract.findMany({
      where: { tenantId, ...(childId ? { childId } : {}) },
      include: {
        child: true,
        contractServices: { include: { service: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.contract.findFirst({
      where: { id, tenantId },
      include: {
        child: true,
        contractServices: { include: { service: true } },
      },
    });
  }

  async findActiveByChild(tenantId: string, childId: string) {
    const now = new Date();
    return this.prisma.contract.findFirst({
      where: {
        tenantId,
        childId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { contractServices: { include: { service: true } } },
    });
  }
}
