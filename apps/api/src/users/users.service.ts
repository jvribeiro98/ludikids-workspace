import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getRoles(userId: string): Promise<{ name: RoleName }[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur) => ({ name: ur.role.name }));
  }

  async setRefreshToken(userId: string, token: string | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token },
    });
  }
}
