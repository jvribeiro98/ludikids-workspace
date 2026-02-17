import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { AlertsModule } from '../alerts/alerts.module';
import { BackupsModule } from '../backups/backups.module';

@Module({
  imports: [WhatsAppModule, AlertsModule, BackupsModule],
  providers: [JobsService],
})
export class JobsModule {}
