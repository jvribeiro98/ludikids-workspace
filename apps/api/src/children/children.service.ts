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
    const child = await this.prisma.child.findFirst({
      where: { id, tenantId },
      include: {
        class: true,
        guardians: { include: { guardian: true } },
        addresses: true,
        authorizedPickups: true,
      },
    });
    if (!child) return null;
    return child;
  }

  async update(tenantId: string, id: string, dto: UpdateChildDto) {
    return this.prisma.child.update({
      where: { id, tenantId },
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
      where: { id, tenantId },
    });
  }

  async addAddress(
    tenantId: string,
    childId: string,
    dto: {
      label?: string;
      street: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city: string;
      state: string;
      zipCode?: string;
    },
  ) {
    await this.prisma.child.findFirstOrThrow({ where: { id: childId, tenantId } });
    return this.prisma.childAddress.create({
      data: { tenantId, childId, ...dto },
    });
  }

  async listAddresses(tenantId: string, childId: string) {
    await this.prisma.child.findFirstOrThrow({ where: { id: childId, tenantId } });
    return this.prisma.childAddress.findMany({ where: { childId }, orderBy: { createdAt: 'asc' } });
  }

  async updateAddress(
    tenantId: string,
    childId: string,
    addressId: string,
    dto: Partial<{
      label: string;
      street: string;
      number: string;
      complement: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    }>,
  ) {
    await this.prisma.child.findFirstOrThrow({ where: { id: childId, tenantId } });
    const addr = await this.prisma.childAddress.findFirst({ where: { id: addressId, tenantId } });
    if (!addr) throw new Error('Endereço não encontrado');
    return this.prisma.childAddress.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async removeAddress(tenantId: string, childId: string, addressId: string) {
    await this.prisma.child.findFirstOrThrow({ where: { id: childId, tenantId } });
    const addr = await this.prisma.childAddress.findFirst({ where: { id: addressId, tenantId } });
    if (!addr) throw new Error('Endereço não encontrado');
    return this.prisma.childAddress.delete({ where: { id: addressId } });
  }

  async addAuthorizedPickup(
    tenantId: string,
    childId: string,
    dto: { type: string; name?: string; phone?: string; document?: string },
  ) {
    await this.prisma.child.findFirstOrThrow({ where: { id: childId, tenantId } });
    return this.prisma.authorizedPickup.create({
      data: { tenantId, childId, type: dto.type as any, name: dto.name, phone: dto.phone, document: dto.document },
    });
  }

  async listAuthorizedPickups(tenantId: string, childId: string) {
    await this.prisma.child.findFirstOrThrow({ where: { id: childId, tenantId } });
    return this.prisma.authorizedPickup.findMany({ where: { childId }, orderBy: { createdAt: 'asc' } });
  }

  async updateAuthorizedPickup(
    tenantId: string,
    childId: string,
    pickupId: string,
    dto: Partial<{ type: string; name: string; phone: string; document: string }>,
  ) {
    await this.prisma.child.findFirstOrThrow({ where: { id: childId, tenantId } });
    const pickup = await this.prisma.authorizedPickup.findFirst({ where: { id: pickupId, tenantId } });
    if (!pickup) throw new Error('Autorizado não encontrado');
    const data: any = { ...dto };
    if (dto.type) data.type = dto.type as any;
    return this.prisma.authorizedPickup.update({
      where: { id: pickupId },
      data,
    });
  }

  async removeAuthorizedPickup(tenantId: string, childId: string, pickupId: string) {
    await this.prisma.child.findFirstOrThrow({ where: { id: childId, tenantId } });
    const pickup = await this.prisma.authorizedPickup.findFirst({ where: { id: pickupId, tenantId } });
    if (!pickup) throw new Error('Autorizado não encontrado');
    return this.prisma.authorizedPickup.delete({ where: { id: pickupId } });
  }
}
