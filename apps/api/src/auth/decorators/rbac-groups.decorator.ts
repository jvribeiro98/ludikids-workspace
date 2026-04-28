import { RoleName } from '@prisma/client';
import { Roles } from './roles.decorator';

export const ACADEMIC_ROLES: RoleName[] = [
  RoleName.MODERADOR,
  RoleName.ADMINISTRADOR,
  RoleName.ADMIN_CEO,
  RoleName.COORDENACAO,
  RoleName.PROFESSOR,
  RoleName.FUNCIONARIO,
];

export const FINANCIAL_ROLES: RoleName[] = [
  RoleName.MODERADOR,
  RoleName.ADMINISTRADOR,
  RoleName.ADMIN_CEO,
  RoleName.FINANCEIRO,
];

export const MANAGEMENT_ROLES: RoleName[] = [
  RoleName.MODERADOR,
  RoleName.ADMINISTRADOR,
  RoleName.ADMIN_CEO,
  RoleName.COORDENACAO,
];

export const FULL_ACCESS_ROLES: RoleName[] = [
  RoleName.MODERADOR,
  RoleName.ADMINISTRADOR,
  RoleName.ADMIN_CEO,
];

export const AcademicAccess = () => Roles(...ACADEMIC_ROLES);
export const FinancialAccess = () => Roles(...FINANCIAL_ROLES);
export const ManagementAccess = () => Roles(...MANAGEMENT_ROLES);
export const FullAccess = () => Roles(...FULL_ACCESS_ROLES);
