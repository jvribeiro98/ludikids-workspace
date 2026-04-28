/**
 * Constantes compartilhadas LudiKids
 */

export const APP_NAME = 'LudiKids';

export const ROLE_NAMES = {
  MODERADOR: 'MODERADOR',
  ADMINISTRADOR: 'ADMINISTRADOR',
  ADMIN_CEO: 'ADMIN_CEO',
  COORDENACAO: 'COORDENACAO',
  FINANCEIRO: 'FINANCEIRO',
  PROFESSOR: 'PROFESSOR',
  FUNCIONARIO: 'FUNCIONARIO',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export const INVOICE_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  PARTIAL: 'PARTIAL',
  CANCELLED: 'CANCELLED',
} as const;

export const PAYMENT_METHODS = {
  PIX: 'PIX',
  CASH: 'CASH',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
  OTHER: 'OTHER',
} as const;

export const INBOX_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CONTACTED: 'CONTACTED',
} as const;

export const PUNCH_TYPE = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
} as const;

export const MESSAGE_RULE_TRIGGER = {
  D_MINUS_2: 'D_MINUS_2',
  D_0: 'D_0',
  D_PLUS_10: 'D_PLUS_10',
  OVERDUE: 'OVERDUE',
} as const;

export const OUTBOX_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;
