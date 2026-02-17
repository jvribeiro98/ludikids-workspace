import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InboxStatus } from '@prisma/client';

@Injectable()
export class CoordinationInboxService {
  constructor(private prisma: PrismaService) {}

  async listPending(tenantId: string) {
    const items = await this.prisma.coordinationInboxItem.findMany({
      where: { status: 'PENDING', childId: { not: null }, child: { tenantId } },
      include: {
        child: true,
        dailyLogItem: {
          include: { dailyLog: { include: { class: true } }, incidents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return items;
  }

  async approve(id: string, userId: string, notes?: string) {
    return this.prisma.coordinationInboxItem.update({
      where: { id },
      data: { status: InboxStatus.APPROVED, reviewedAt: new Date(), reviewedBy: userId, notes },
    });
  }

  async reject(id: string, userId: string, notes?: string) {
    return this.prisma.coordinationInboxItem.update({
      where: { id },
      data: { status: InboxStatus.REJECTED, reviewedAt: new Date(), reviewedBy: userId, notes },
    });
  }

  async markContacted(id: string) {
    return this.prisma.coordinationInboxItem.update({
      where: { id },
      data: { contactedGuardian: true },
    });
  }
}
