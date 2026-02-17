import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldData?: object;
    newData?: object;
    ip?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: params.oldData as any,
        newData: params.newData as any,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }
}
