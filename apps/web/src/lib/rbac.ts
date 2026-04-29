export type AppRole =
  | 'MODERADOR'
  | 'ADMINISTRADOR'
  | 'ADMIN_CEO'
  | 'COORDENACAO'
  | 'FINANCEIRO'
  | 'PROFESSOR'
  | 'FUNCIONARIO';

export const FINANCIAL_ROLES: AppRole[] = ['MODERADOR', 'ADMINISTRADOR', 'ADMIN_CEO', 'FINANCEIRO'];
export const MANAGEMENT_ROLES: AppRole[] = ['MODERADOR', 'ADMINISTRADOR', 'ADMIN_CEO', 'COORDENACAO'];
export const ACADEMIC_ROLES: AppRole[] = [
  'MODERADOR',
  'ADMINISTRADOR',
  'ADMIN_CEO',
  'COORDENACAO',
  'PROFESSOR',
  'FUNCIONARIO',
];
export const FULL_ACCESS_ROLES: AppRole[] = ['MODERADOR', 'ADMINISTRADOR', 'ADMIN_CEO'];

export function hasAnyRole(userRoles: string[] | undefined, requiredRoles: AppRole[]) {
  if (!userRoles?.length) return false;
  return requiredRoles.some((role) => userRoles.includes(role));
}
