import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  function makeContext(userRoles: string[] = []): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: userRoles } }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite quando a rota não exige role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const can = guard.canActivate(makeContext(['PROFESSOR']));

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
    expect(can).toBe(true);
  });

  it('bloqueia quando usuário não tem nenhum role requerido', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([RoleName.FINANCEIRO]);

    const can = guard.canActivate(makeContext([RoleName.PROFESSOR]));

    expect(can).toBe(false);
  });

  it('permite quando usuário tem ao menos um role requerido', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleName.COORDENACAO,
      RoleName.ADMIN_CEO,
    ]);

    const can = guard.canActivate(makeContext([RoleName.PROFESSOR, RoleName.ADMIN_CEO]));

    expect(can).toBe(true);
  });
});
