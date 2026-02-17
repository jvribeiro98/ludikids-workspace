import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const roles = await this.usersService.getRoles(user.id);
    const roleNames = roles.map((r) => r.name);

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: roleNames,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET não configurado');
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { secret: refreshSecret, expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') },
    );

    await this.usersService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: roleNames,
        tenantId: user.tenantId,
      },
      expiresIn: 900, // 15 min em segundos
    };
  }

  async refresh(refreshToken: string) {
    try {
      const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
      if (!refreshSecret) throw new UnauthorizedException('Refresh não configurado');
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      }) as { sub?: string; type?: string };
      if (payload.type !== 'refresh' || !payload.sub) throw new UnauthorizedException();
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }
      const roles = await this.usersService.getRoles(user.id);
      const roleNames = roles.map((r) => r.name);
      const newPayload = {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roles: roleNames,
      };
      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      });
      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: roleNames,
          tenantId: user.tenantId,
        },
        expiresIn: 900,
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
    return { message: 'Logout realizado' };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
