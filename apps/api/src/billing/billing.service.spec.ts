import { InvoiceStatus } from '@prisma/client';
import { BillingService } from './billing.service';

describe('BillingService.getMonthlySummary', () => {
  const prisma = {
    billingCycle: { findUnique: jest.fn() },
    invoice: { findMany: jest.fn() },
    expense: { aggregate: jest.fn() },
    contract: { findMany: jest.fn() },
  } as any;

  const audit = {
    log: jest.fn(),
  } as any;

  const service = new BillingService(prisma, audit);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna resumo zerado quando não existe ciclo', async () => {
    prisma.billingCycle.findUnique.mockResolvedValue(null);

    const result = await service.getMonthlySummary('tenant-1', 2026, 4);

    expect(result.totalExpected).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.totalPending).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.expenseTotal).toBe(0);
    expect(result.activeChildren).toBe(0);
    expect(result.costPerChild).toBe(0);
    expect(result.comparison).toEqual({
      expectedDelta: 0,
      paidDelta: 0,
      pendingDelta: 0,
      overdueDelta: 0,
      expenseDelta: 0,
      costPerChildDelta: 0,
    });
  });

  it('calcula resumo, custo por aluno e comparação com período anterior', async () => {
    prisma.billingCycle.findUnique
      .mockResolvedValueOnce({ id: 'cycle-current' })
      .mockResolvedValueOnce({ id: 'cycle-previous' });

    prisma.invoice.findMany
      .mockResolvedValueOnce([
        { total: 1000, paidAmount: 600, dueDate: new Date('2026-04-10'), status: InvoiceStatus.PENDING },
        { total: 500, paidAmount: 500, dueDate: new Date('2026-04-01'), status: InvoiceStatus.PAID },
      ])
      .mockResolvedValueOnce([
        { total: 900, paidAmount: 700, dueDate: new Date('2026-03-10'), status: InvoiceStatus.PAID },
      ]);

    prisma.expense.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 300 } })
      .mockResolvedValueOnce({ _sum: { amount: 200 } });

    prisma.contract.findMany
      .mockResolvedValueOnce([{ childId: 'a' }, { childId: 'b' }])
      .mockResolvedValueOnce([{ childId: 'a' }]);

    const result = await service.getMonthlySummary('tenant-1', 2026, 4);

    expect(result.totalExpected).toBe(1500);
    expect(result.totalPaid).toBe(1100);
    expect(result.totalPending).toBe(400);
    expect(result.expenseTotal).toBe(300);
    expect(result.activeChildren).toBe(2);
    expect(result.costPerChild).toBe(150);

    expect(result.previous.totalExpected).toBe(900);
    expect(result.previous.totalPaid).toBe(700);
    expect(result.previous.totalPending).toBe(200);
    expect(result.previous.expenseTotal).toBe(200);
    expect(result.previous.activeChildren).toBe(1);
    expect(result.previous.costPerChild).toBe(200);

    expect(result.comparison).toEqual({
      expectedDelta: 600,
      paidDelta: 400,
      pendingDelta: 200,
      overdueDelta: 1,
      expenseDelta: 100,
      costPerChildDelta: -50,
    });
  });
});
