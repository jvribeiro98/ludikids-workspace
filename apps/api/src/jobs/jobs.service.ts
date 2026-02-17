import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { AlertsService } from '../alerts/alerts.service';
import { BackupsService } from '../backups/backups.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private whatsApp: WhatsAppService,
    private alerts: AlertsService,
    private backups: BackupsService,
  ) {}

  @Cron('0 6 * * *') // 06:00 diário
  async dailyBillingAndWhatsApp() {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    for (const t of tenants) {
      try {
        await this.whatsApp.processRulesForTenant(t.id);
      } catch (e) {
        console.error('WhatsApp process rules', t.id, e);
      }
    }
  }

  @Cron('0 7 * * *') // 07:00 diário
  async dailyAlerts() {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    for (const t of tenants) {
      try {
        await this.alerts.generateAlerts(t.id);
      } catch (e) {
        console.error('Alerts generate', t.id, e);
      }
    }
  }

  @Cron('0 2 * * *') // 02:00 diário
  async dailyBackup() {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    for (const t of tenants) {
      try {
        await this.backups.runBackup(t.id);
      } catch (e) {
        console.error('Backup', t.id, e);
      }
    }
  }
}
