import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PunchType } from '@prisma/client';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async punch(
    staffProfileId: string,
    type: PunchType,
    latitude?: number,
    longitude?: number,
    accuracy?: number,
    tenantId?: string,
  ) {
    const tid = tenantId ?? (await this.prisma.staffProfile.findUnique({ where: { id: staffProfileId } }))?.tenantId;
    const tenant = tid ? await this.prisma.tenant.findUnique({ where: { id: tid } }) : null;
    if (!tenant) throw new Error('Tenant não encontrado');
    const radius = tenant.geofenceRadiusMeters ?? 200;
    let validated = true;
    if (latitude != null && longitude != null && tenant.latitude != null && tenant.longitude != null) {
      const dist = this.haversineMeters(tenant.latitude, tenant.longitude, latitude, longitude);
      validated = dist <= radius;
    }
    return this.prisma.timeClockEvent.create({
      data: {
        staffProfileId,
        type,
        latitude,
        longitude,
        accuracy,
        validated,
      },
    });
  }

  haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getSchedules(staffProfileId: string) {
    return this.prisma.workSchedule.findMany({
      where: { staffProfileId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async setSchedule(staffProfileId: string, dayOfWeek: number, startTime: string, endTime: string) {
    return this.prisma.workSchedule.upsert({
      where: { staffProfileId_dayOfWeek: { staffProfileId, dayOfWeek } },
      create: { staffProfileId, dayOfWeek, startTime, endTime },
      update: { startTime, endTime },
    });
  }

  async listStaff(tenantId: string) {
    return this.prisma.staffProfile.findMany({
      where: { tenantId },
      include: { workSchedules: true },
    });
  }

  async createStaff(tenantId: string, data: { name: string; email?: string; phone?: string; hireDate?: string }) {
    return this.prisma.staffProfile.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      },
    });
  }

  async getMonthlyReport(tenantId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const events = await this.prisma.timeClockEvent.findMany({
      where: {
        staffProfile: { tenantId },
        punchedAt: { gte: start, lte: end },
      },
      include: { staffProfile: true },
      orderBy: { punchedAt: 'asc' },
    });
    const byStaff = new Map<string, { events: typeof events; lateCount: number; absentCount: number }>();
    for (const e of events) {
      if (!byStaff.has(e.staffProfileId)) {
        byStaff.set(e.staffProfileId, { events: [], lateCount: 0, absentCount: 0 });
      }
      const rec = byStaff.get(e.staffProfileId)!;
      rec.events.push(e);
    }
    return { byStaff: Object.fromEntries(byStaff), start, end };
  }
}
