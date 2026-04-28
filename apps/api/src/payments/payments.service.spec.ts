import { PaymentsService } from './payments.service';

describe('PaymentsService (Asaas webhook)', () => {
  const prisma: any = {
    payment: { findFirst: jest.fn() },
    invoice: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };
  const audit = { log: jest.fn() } as any;

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(prisma, audit);
  });

  it('ignora evento que não representa pagamento recebido', async () => {
    const result = await service.processAsaasWebhook({
      id: 'evt_1',
      event: 'INVOICE_CREATED',
      payment: {},
    });

    expect(result).toEqual({ processed: false, reason: 'event_not_supported' });
    expect(prisma.invoice.findFirst).not.toHaveBeenCalled();
  });

  it('evita duplicidade quando referência do evento já foi processada', async () => {
    prisma.payment.findFirst.mockResolvedValueOnce({ id: 'pay_existing' });

    const result = await service.processAsaasWebhook({
      id: 'evt_dup',
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_asaas_1',
        value: 130,
        billingType: 'PIX',
        paymentDate: '2026-04-28',
        externalReference: 'inv_123',
      },
    });

    expect(result).toEqual({ processed: false, reason: 'duplicate_event' });
  });

  it('registra pagamento quando webhook válido chega pela primeira vez', async () => {
    prisma.payment.findFirst.mockResolvedValueOnce(null);
    prisma.invoice.findFirst.mockResolvedValueOnce({
      id: 'inv_123',
      tenantId: 'tenant_1',
    });

    const registerSpy = jest
      .spyOn(service, 'register')
      .mockResolvedValue({ id: 'inv_123', status: 'PAID' } as any);

    const result = await service.processAsaasWebhook({
      id: 'evt_ok',
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_asaas_1',
        value: 130,
        billingType: 'PIX',
        paymentDate: '2026-04-28',
        externalReference: 'inv_123',
      },
    });

    expect(registerSpy).toHaveBeenCalledWith(
      'tenant_1',
      undefined,
      'inv_123',
      130,
      'PIX',
      expect.any(Date),
      'evt_ok',
      'Asaas paymentId=pay_asaas_1',
    );

    expect(result).toEqual({ processed: true, invoiceId: 'inv_123', action: 'received' });
  });

  it('reabre a fatura ao receber evento de estorno', async () => {
    prisma.payment.findFirst.mockResolvedValueOnce(null);
    prisma.invoice.findFirst.mockResolvedValueOnce({ id: 'inv_123', tenantId: 'tenant_1' });
    prisma.invoice.findUnique.mockResolvedValueOnce({
      id: 'inv_123',
      total: 200,
      paidAmount: 200,
      status: 'PAID',
    });
    prisma.invoice.update.mockResolvedValueOnce({ id: 'inv_123' });

    const result = await service.processAsaasWebhook({
      id: 'evt_refund',
      event: 'PAYMENT_REFUNDED',
      payment: { externalReference: 'inv_123', value: 200 },
    });

    expect(prisma.invoice.update).toHaveBeenCalled();
    expect(result).toEqual({ processed: true, invoiceId: 'inv_123', action: 'reverted' });
  });
});
