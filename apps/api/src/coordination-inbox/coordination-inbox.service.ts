import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InboxStatus } from '@prisma/client';

@Injectable()
export class CoordinationInboxService {
  constructor(private prisma: PrismaService) {}

  async listPending(tenantId: string) {
    return this.prisma.coordinationInboxItem.findMany({
      where: { tenantId, status: 'PENDING' },
      include: {
        child: true,
        dailyLogItem: {
          include: { dailyLog: { include: { class: true } }, incidents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(tenantId: string, id: string, userId: string, notes?: string) {
    return this.prisma.coordinationInboxItem.update({
      where: { id, tenantId },
      data: { status: InboxStatus.APPROVED, reviewedAt: new Date(), reviewedBy: userId, notes },
    });
  }

  async reject(tenantId: string, id: string, userId: string, notes?: string) {
    return this.prisma.coordinationInboxItem.update({
      where: { id, tenantId },
      data: { status: InboxStatus.REJECTED, reviewedAt: new Date(), reviewedBy: userId, notes },
    });
  }

  async markContacted(tenantId: string, id: string) {
    return this.prisma.coordinationInboxItem.update({
      where: { id, tenantId },
      data: { contactedGuardian: true },
    });
  }
}
