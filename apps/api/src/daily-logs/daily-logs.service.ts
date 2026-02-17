import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyLogsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateDailyLog(classId: string, date: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    let log = await this.prisma.dailyLog.findUnique({
      where: { classId_date: { classId, date: d } },
      include: {
        items: {
          include: { child: true, incidents: true },
        },
      },
    });
    if (!log) {
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        include: { children: true },
      });
      if (!classEntity) throw new Error('Turma não encontrada');
      log = await this.prisma.dailyLog.create({
        data: {
          classId,
          date: d,
          items: {
            create: classEntity.children.map((c) => ({ childId: c.id })),
          },
        },
        include: {
          items: { include: { child: true, incidents: true } },
        },
      });
    }
    return log;
  }

  async updateItem(
    dailyLogItemId: string,
    data: {
      bath?: boolean;
      feeding?: string;
      sleepMinutes?: number;
      snack?: string;
      observations?: string;
    },
  ) {
    return this.prisma.dailyLogItem.update({
      where: { id: dailyLogItemId },
      data,
      include: { child: true },
    });
  }

  async addIncident(dailyLogItemId: string, description: string, severity?: string) {
    return this.prisma.incident.create({
      data: { dailyLogItemId, description, severity },
    });
  }

  async sendToCoordination(dailyLogItemId: string, childId: string) {
    return this.prisma.coordinationInboxItem.create({
      data: { dailyLogItemId, childId, status: 'PENDING' },
    });
  }
}
