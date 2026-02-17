import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageRuleTrigger, OutboxStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WhatsAppService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Templates
  async createTemplate(tenantId: string, userId: string | undefined, code: string, name: string, body: string) {
    const template = await this.prisma.messageTemplate.upsert({
      where: { tenantId_code: { tenantId, code } },
      create: { tenantId, code, name, body },
      update: { name, body },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: 'UPSERT',
      entity: 'MessageTemplate',
      entityId: template.id,
      newData: { code, name, body },
    });
    return template;
  }

  async listTemplates(tenantId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  async listRules(tenantId: string) {
    return this.prisma.messageRule.findMany({
      where: { tenantId },
      include: { template: true },
      orderBy: { trigger: 'asc' },
    });
  }

  async upsertRule(tenantId: string, userId: string | undefined, trigger: MessageRuleTrigger, templateId?: string, active = true) {
    const rule = await this.prisma.messageRule.upsert({
      where: { tenantId_trigger: { tenantId, trigger } },
      create: { tenantId, trigger, templateId, active },
      update: { templateId, active },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: 'UPSERT',
      entity: 'MessageRule',
      entityId: rule.id,
      newData: { trigger, templateId, active },
    });
    return rule;
  }

  // Job: buscar faturas elegíveis e criar itens na outbox (idempotente)
  async processRulesForTenant(tenantId: string) {
    const rules = await this.prisma.messageRule.findMany({
      where: { tenantId, active: true },
      include: { template: true },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const created: string[] = [];
    for (const rule of rules) {
      const invoices = await this.getEligibleInvoices(tenantId, rule.trigger, today);
      for (const inv of invoices) {
        const phone = await this.getGuardianPhone(inv.childId);
        if (!phone) continue;
        const existing = await this.prisma.messageOutbox.findFirst({
          where: {
            tenantId,
            invoiceId: inv.id,
            templateCode: rule.template?.code ?? null,
            createdAt: { gte: new Date(today.getTime() - 86400000) },
          },
        });
        if (existing) continue;
        const body = this.renderBody(rule.template?.body ?? 'Lembrete: fatura em aberto.', {
          nome: (inv as any).child?.name ?? 'Responsável',
          valor: String(inv.total),
          vencimento: inv.dueDate.toLocaleDateString('pt-BR'),
        });
        const out = await this.prisma.messageOutbox.create({
          data: {
            tenantId,
            invoiceId: inv.id,
            phone,
            templateCode: rule.template?.code ?? null,
            body,
            status: OutboxStatus.PENDING,
          },
        });
        created.push(out.id);
      }
    }
    return { created: created.length };
  }

  private async getEligibleInvoices(tenantId: string, trigger: MessageRuleTrigger, today: Date) {
    const start = new Date(today);
    const end = new Date(today);
    if (trigger === 'D_MINUS_2') {
      start.setDate(start.getDate() + 2);
      end.setDate(end.getDate() + 2);
    } else if (trigger === 'D_0') {
      start.setDate(start.getDate());
      end.setDate(end.getDate());
    } else if (trigger === 'D_PLUS_10') {
      start.setDate(start.getDate() - 10);
      end.setDate(end.getDate() - 10);
    } else if (trigger === 'OVERDUE') {
      return this.prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { lt: today },
        },
        include: { child: true },
      });
    }
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        dueDate: { gte: start, lte: end },
      },
      include: { child: true },
    });
  }

  private async getGuardianPhone(childId: string): Promise<string | null> {
    const link = await this.prisma.childGuardian.findFirst({
      where: { childId, guardian: { phone: { not: null } } },
      include: { guardian: true },
    });
    return link?.guardian?.phone ?? null;
  }

  private renderBody(body: string, vars: Record<string, string>) {
    let out = body;
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return out;
  }

  async listOutbox(tenantId: string, status?: OutboxStatus) {
    return this.prisma.messageOutbox.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      include: { invoice: { include: { child: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // Stub: marcar como enviado
  async sendQueuedStub(tenantId: string, outboxId?: string) {
    const where: any = { tenantId, status: OutboxStatus.PENDING };
    if (outboxId) where.id = outboxId;
    const items = await this.prisma.messageOutbox.findMany({ where });
    for (const item of items) {
      await this.prisma.messageOutbox.update({
        where: { id: item.id },
        data: { status: OutboxStatus.SENT, sentAt: new Date() },
      });
    }
    return { sent: items.length };
  }
}
