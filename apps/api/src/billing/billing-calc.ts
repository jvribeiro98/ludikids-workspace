import { Decimal } from '@prisma/client/runtime/library';

export interface TenantBillingConfig {
  lateFeePercent?: Decimal | number | null;
  interestPercentPerMonth?: Decimal | number | null;
  lateFeeMaxPercent?: Decimal | number | null;
}

/**
 * Calcula multa (uma vez) e juros (proporcional aos dias) sobre valor em atraso.
 * lateFee: percentual sobre subtotal, limitado por lateFeeMaxPercent.
 * interest: (interestPercentPerMonth / 30) * dias de atraso, sobre subtotal.
 */
export function calcLateFeeAndInterest(
  subtotal: Decimal | number,
  dueDate: Date,
  paidAtOrToday: Date,
  config: TenantBillingConfig,
): { lateFeeAmount: Decimal; interestAmount: Decimal } {
  const sub = new Decimal(subtotal);
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  const ref = new Date(paidAtOrToday);
  if (ref <= due) {
    return { lateFeeAmount: new Decimal(0), interestAmount: new Decimal(0) };
  }
  const lateFeePct = config.lateFeePercent != null ? Number(config.lateFeePercent) : 2;
  const maxPct = config.lateFeeMaxPercent != null ? Number(config.lateFeeMaxPercent) : 10;
  const interestPctPerMonth = config.interestPercentPerMonth != null ? Number(config.interestPercentPerMonth) : 1;

  const lateFeeAmount = sub.mul(Math.min(lateFeePct, maxPct)).div(100);

  const diffMs = ref.getTime() - due.getTime();
  const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const interestPerDay = interestPctPerMonth / 30;
  const interestAmount = sub.mul(interestPerDay * Math.max(0, daysOverdue)).div(100);

  return { lateFeeAmount, interestAmount };
}
