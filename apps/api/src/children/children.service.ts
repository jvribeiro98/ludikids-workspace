import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
export class ChildrenService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateChildDto) {
    return this.prisma.child.create({
      data: {
        tenantId,
        name: dto.name,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        classId: dto.classId,
      },
      include: { class: true },
    });
  }

  async findAll(tenantId: string, classId?: string) {
    return this.prisma.child.findMany({
      where: { tenantId, ...(classId ? { classId } : {}) },
      include: { class: true, guardians: { include: { guardian: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.child.findFirst({
      where: { id, tenantId },
      include: {
        class: true,
        guardians: { include: { guardian: true } },
        addresses: true,
        authorizedPickups: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateChildDto) {
    return this.prisma.child.update({
      where: { id },
      data: {
        name: dto.name,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        classId: dto.classId,
      },
      include: { class: true },
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.child.delete({
      where: { id },
    });
  }
}
