import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(tenantId: string, userId: string | undefined, dto: CreateContractDto) {
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
    await this.audit.log({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Contract',
      entityId: contract.id,
      newData: { childId: dto.childId, startDate: dto.startDate, dueDay: dto.dueDay },
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

  async update(
    tenantId: string,
    userId: string | undefined,
    id: string,
    dto: Partial<{
      startDate: string;
      endDate: string | null;
      dueDay: number;
      punctualityDiscount: boolean;
      siblingDiscount: boolean;
      siblingCount: number;
      notes: string;
      services: { serviceId: string; unitPrice: number }[];
    }>,
  ) {
    const existing = await this.prisma.contract.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Contrato não encontrado');
    const data: any = {};
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.dueDay !== undefined) data.dueDay = dto.dueDay;
    if (dto.punctualityDiscount !== undefined) data.punctualityDiscount = dto.punctualityDiscount;
    if (dto.siblingDiscount !== undefined) data.siblingDiscount = dto.siblingDiscount;
    if (dto.siblingCount !== undefined) data.siblingCount = dto.siblingCount;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.services !== undefined) {
      await this.prisma.contractService.deleteMany({ where: { contractId: id } });
      data.contractServices = {
        create: dto.services.map((s) => ({
          serviceId: s.serviceId,
          unitPrice: new Decimal(s.unitPrice),
        })),
      };
    }
    const contract = await this.prisma.contract.update({
      where: { id, tenantId },
      data,
      include: { contractServices: { include: { service: true } }, child: true },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Contract',
      entityId: id,
      newData: data,
    });
    return contract;
  }

  async remove(tenantId: string, userId: string | undefined, id: string) {
    const existing = await this.prisma.contract.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Contrato não encontrado');
    await this.prisma.contract.delete({ where: { id, tenantId } });
    await this.audit.log({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'Contract',
      entityId: id,
      oldData: { childId: existing.childId },
    });
  }
}
