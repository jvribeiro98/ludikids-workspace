import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { AlertsModule } from '../alerts/alerts.module';
import { BackupsModule } from '../backups/backups.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [WhatsAppModule, AlertsModule, BackupsModule, BillingModule],
  providers: [JobsService],
})
export class JobsModule {}
