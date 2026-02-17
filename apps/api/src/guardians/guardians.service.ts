import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuardiansService {
  constructor(private prisma: PrismaService) {}

  async linkChildGuardian(childId: string, guardianId: string, relation?: string, isResponsible = false) {
    return this.prisma.childGuardian.upsert({
      where: { childId_guardianId: { childId, guardianId } },
      create: { childId, guardianId, relation, isResponsible },
      update: { relation, isResponsible },
    });
  }

  async createGuardian(data: { name: string; email?: string; phone?: string; cpf?: string; isPrimary?: boolean }) {
    return this.prisma.guardian.create({ data });
  }

  async findGuardiansByChild(childId: string) {
    return this.prisma.childGuardian.findMany({
      where: { childId },
      include: { guardian: true },
    });
  }
}
