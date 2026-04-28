import { ChildrenService } from './children.service';

describe('ChildrenService.getTimeline', () => {
  const prisma = {
    child: {
      findFirstOrThrow: jest.fn(),
    },
    contract: { findMany: jest.fn() },
    childDocument: { findMany: jest.fn() },
    dailyLogItem: { findMany: jest.fn() },
    coordinationInboxItem: { findMany: jest.fn() },
    invoice: { findMany: jest.fn() },
  } as any;

  const service = new ChildrenService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna timeline ordenada e filtrável por tipo', async () => {
    prisma.child.findFirstOrThrow
      .mockResolvedValueOnce({ id: 'c1' })
      .mockResolvedValueOnce({ id: 'c1', name: 'Alice', createdAt: new Date('2026-04-01T10:00:00.000Z') });

    prisma.contract.findMany.mockResolvedValue([
      { createdAt: new Date('2026-04-02T10:00:00.000Z'), startDate: new Date('2026-04-01T00:00:00.000Z'), dueDay: 10 },
    ]);
    prisma.childDocument.findMany.mockResolvedValue([
      { createdAt: new Date('2026-04-03T10:00:00.000Z'), type: 'CONTRATO', fileName: 'contrato.pdf' },
    ]);
    prisma.dailyLogItem.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-04-04T10:00:00.000Z'),
        observations: 'Observação importante',
        dailyLog: { date: new Date('2026-04-04T00:00:00.000Z') },
        incidents: [{ createdAt: new Date('2026-04-04T12:00:00.000Z'), description: 'Queda leve' }],
      },
    ]);
    prisma.coordinationInboxItem.findMany.mockResolvedValue([
      { createdAt: new Date('2026-04-05T10:00:00.000Z'), status: 'PENDING', notes: 'Verificar' },
    ]);
    prisma.invoice.findMany.mockResolvedValue([
      { dueDate: new Date('2026-04-06T10:00:00.000Z'), status: 'PENDING', total: 1200 },
    ]);

    const result = await service.getTimeline('t1', 'c1', { type: 'financeiro', limit: 10 });

    expect(result.childId).toBe('c1');
    expect(result.total).toBe(1);
    expect(result.events[0]).toMatchObject({
      type: 'financeiro',
      title: 'Fatura vinculada ao aluno',
    });
  });
});
