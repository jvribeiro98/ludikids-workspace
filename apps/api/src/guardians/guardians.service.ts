import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuardiansService {
  constructor(private prisma: PrismaService) {}

  async linkChildGuardian(
    tenantId: string,
    childId: string,
    guardianId: string,
    relation?: string,
    isResponsible = false,
  ) {
    const child = await this.prisma.child.findFirst({ where: { id: childId, tenantId } });
    if (!child) throw new Error('Criança não encontrada');
    const guardian = await this.prisma.guardian.findFirst({ where: { id: guardianId, tenantId } });
    if (!guardian) throw new Error('Responsável não encontrado');
    const existing = await this.prisma.childGuardian.findMany({
      where: { childId },
      include: { guardian: true },
    });
    const willUnsetResponsible = existing.some(
      (cg) => cg.guardianId === guardianId && cg.isResponsible && !isResponsible,
    );
    if (willUnsetResponsible && existing.filter((cg) => cg.isResponsible).length <= 1) {
      throw new Error('Deve haver pelo menos um responsável por criança');
    }
    return this.prisma.childGuardian.upsert({
      where: { childId_guardianId: { childId, guardianId } },
      create: { childId, guardianId, relation, isResponsible },
      update: { relation, isResponsible },
    });
  }

  async createGuardian(
    tenantId: string,
    data: { name: string; email?: string; phone?: string; cpf?: string; isPrimary?: boolean },
  ) {
    return this.prisma.guardian.create({
      data: { tenantId, ...data },
    });
  }

  async findGuardiansByChild(tenantId: string, childId: string) {
    const child = await this.prisma.child.findFirst({ where: { id: childId, tenantId } });
    if (!child) throw new Error('Criança não encontrada');
    return this.prisma.childGuardian.findMany({
      where: { childId },
      include: { guardian: true },
    });
  }
}
