import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { ChildrenModule } from './children/children.module';
import { GuardiansModule } from './guardians/guardians.module';
import { ClassesModule } from './classes/classes.module';
import { ServicesModule } from './services/services.module';
import { ContractsModule } from './contracts/contracts.module';
import { BillingModule } from './billing/billing.module';
import { PaymentsModule } from './payments/payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DailyLogsModule } from './daily-logs/daily-logs.module';
import { CoordinationInboxModule } from './coordination-inbox/coordination-inbox.module';
import { HrModule } from './hr/hr.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AlertsModule } from './alerts/alerts.module';
import { BackupsModule } from './backups/backups.module';
import { AuditModule } from './audit/audit.module';
import { JobsModule } from './jobs/jobs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ChildrenModule,
    GuardiansModule,
    ClassesModule,
    ServicesModule,
    ContractsModule,
    BillingModule,
    PaymentsModule,
    ExpensesModule,
    DailyLogsModule,
    CoordinationInboxModule,
    HrModule,
    WhatsAppModule,
    AlertsModule,
    BackupsModule,
    AuditModule,
    JobsModule,
    DashboardModule,
    HealthModule,
  ],
})
export class AppModule {}
