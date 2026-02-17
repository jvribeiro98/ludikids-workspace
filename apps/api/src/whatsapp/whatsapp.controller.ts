import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WhatsAppService } from './whatsapp.service';
import { MessageRuleTrigger } from '@prisma/client';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsAppService: WhatsAppService) {}

  @Post('templates')
  createTemplate(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { code: string; name: string; body: string },
  ) {
    return this.whatsAppService.createTemplate(tenantId, userId, body.code, body.name, body.body);
  }

  @Get('templates')
  listTemplates(@CurrentUser('tenantId') tenantId: string) {
    return this.whatsAppService.listTemplates(tenantId);
  }

  @Get('rules')
  listRules(@CurrentUser('tenantId') tenantId: string) {
    return this.whatsAppService.listRules(tenantId);
  }

  @Post('rules')
  upsertRule(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { trigger: MessageRuleTrigger; templateId?: string; active?: boolean },
  ) {
    return this.whatsAppService.upsertRule(tenantId, userId, body.trigger, body.templateId, body.active ?? true);
  }

  @Get('outbox')
  listOutbox(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.whatsAppService.listOutbox(tenantId, status as any);
  }

  @Post('process-rules')
  processRules(@CurrentUser('tenantId') tenantId: string) {
    return this.whatsAppService.processRulesForTenant(tenantId);
  }

  @Post('send-queued-stub')
  sendQueuedStub(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { outboxId?: string },
  ) {
    return this.whatsAppService.sendQueuedStub(tenantId, body?.outboxId);
  }
}
