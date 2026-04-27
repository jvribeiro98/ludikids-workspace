import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  function makeSut() {
    const usersService = {
      findByEmail: jest.fn(),
      getRoles: jest.fn(),
      setRefreshToken: jest.fn(),
      findById: jest.fn(),
    } as unknown as UsersService;

    const jwtService = {
      sign: jest.fn((payload: { type?: string }) => (payload.type === 'refresh' ? 'refresh-token' : 'access-token')),
      verify: jest.fn(),
    } as unknown as JwtService;

    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return fallback;
      }),
    } as unknown as ConfigService;

    const authService = new AuthService(usersService, jwtService, config);

    return { authService, usersService, jwtService };
  }

  it('deve falhar quando usuário não existe', async () => {
    const { authService, usersService } = makeSut();
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(authService.login({ email: 'naoexiste@x.com', password: '123' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('deve falhar quando senha estiver inválida', async () => {
    const { authService, usersService } = makeSut();
    const passwordHash = await argon2.hash('SenhaCorreta@123');

    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'teste@ludikids.com.br',
      passwordHash,
      name: 'Teste',
      tenantId: 't1',
    });

    await expect(authService.login({ email: 'teste@ludikids.com.br', password: 'SenhaErrada@123' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('deve logar com sucesso e persistir refresh token', async () => {
    const { authService, usersService, jwtService } = makeSut();
    const passwordHash = await argon2.hash('Admin@123');

    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'u-admin',
      email: 'admin@ludikids.com.br',
      passwordHash,
      name: 'Administrador',
      tenantId: 'tenant-1',
    });
    (usersService.getRoles as jest.Mock).mockResolvedValue([{ name: 'MODERADOR' }]);

    const result = await authService.login({ email: 'admin@ludikids.com.br', password: 'Admin@123' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('admin@ludikids.com.br');
    expect(result.user.roles).toEqual(['MODERADOR']);
    expect(usersService.setRefreshToken).toHaveBeenCalledWith('u-admin', 'refresh-token');
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });
});
