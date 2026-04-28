import { RoleName } from '@prisma/client';
import {
  ACADEMIC_ROLES,
  AcademicAccess,
  FINANCIAL_ROLES,
  FinancialAccess,
  FULL_ACCESS_ROLES,
  FullAccess,
  MANAGEMENT_ROLES,
  ManagementAccess,
} from './rbac-groups.decorator';
import { ROLES_KEY } from './roles.decorator';

describe('rbac group decorators', () => {
  it('expõe listas esperadas por domínio', () => {
    expect(ACADEMIC_ROLES).toEqual([
      RoleName.MODERADOR,
      RoleName.ADMINISTRADOR,
      RoleName.ADMIN_CEO,
      RoleName.COORDENACAO,
      RoleName.PROFESSOR,
      RoleName.FUNCIONARIO,
    ]);

    expect(FINANCIAL_ROLES).toEqual([
      RoleName.MODERADOR,
      RoleName.ADMINISTRADOR,
      RoleName.ADMIN_CEO,
      RoleName.FINANCEIRO,
    ]);

    expect(MANAGEMENT_ROLES).toEqual([
      RoleName.MODERADOR,
      RoleName.ADMINISTRADOR,
      RoleName.ADMIN_CEO,
      RoleName.COORDENACAO,
    ]);

    expect(FULL_ACCESS_ROLES).toEqual([
      RoleName.MODERADOR,
      RoleName.ADMINISTRADOR,
      RoleName.ADMIN_CEO,
    ]);
  });

  it('anexa metadata de roles no handler', () => {
    class TestController {
      @AcademicAccess()
      academic() {}

      @FinancialAccess()
      financial() {}

      @ManagementAccess()
      management() {}

      @FullAccess()
      full() {}
    }

    const academicRoles = Reflect.getMetadata(ROLES_KEY, TestController.prototype.academic);
    const financialRoles = Reflect.getMetadata(ROLES_KEY, TestController.prototype.financial);
    const managementRoles = Reflect.getMetadata(ROLES_KEY, TestController.prototype.management);
    const fullRoles = Reflect.getMetadata(ROLES_KEY, TestController.prototype.full);

    expect(academicRoles).toEqual(ACADEMIC_ROLES);
    expect(financialRoles).toEqual(FINANCIAL_ROLES);
    expect(managementRoles).toEqual(MANAGEMENT_ROLES);
    expect(fullRoles).toEqual(FULL_ACCESS_ROLES);
  });
});
