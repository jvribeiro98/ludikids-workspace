import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async getConfig(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        geofenceRadiusMeters: true,
        dueDayDefault: true,
        lateFeePercent: true,
        interestPercentPerMonth: true,
        lateFeeMaxPercent: true,
        punctualityDiscountPercent: true,
        siblingDiscountPercent: true,
        siblingMaxCount: true,
      },
    });
    return t;
  }
}
