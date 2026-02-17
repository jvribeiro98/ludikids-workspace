import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ROLES = ['MODERADOR', 'ADMINISTRADOR', 'COORDENACAO', 'PROFESSOR'] as const;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ludikids.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  let tenant = await prisma.tenant.findFirst({ where: { slug: 'ludikids' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'LudiKids',
        slug: 'ludikids',
        address: 'Endereço da creche',
        geofenceRadiusMeters: 200,
        dueDayDefault: 10,
        lateFeePercent: 2,
        interestPercentPerMonth: 1,
        lateFeeMaxPercent: 10,
        punctualityDiscountPercent: 5,
        siblingDiscountPercent: 10,
        siblingMaxCount: 2,
      },
    });
    console.log('Tenant LudiKids criado.');
  }

  for (const name of ROLES) {
    await prisma.role.upsert({
      where: { name: name as any },
      create: { name: name as any, tenantId: tenant.id },
      update: {},
    });
  }
  console.log('Roles criadas.');

  const moderadorRole = await prisma.role.findUnique({
    where: { name: 'MODERADOR' as any },
  });
  if (!moderadorRole) throw new Error('Role MODERADOR não encontrada.');

  let user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    const passwordHash = await argon2.hash(adminPassword);
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Administrador',
        tenantId: tenant.id,
      },
    });
    await prisma.userRole.create({
      data: { userId: user.id, roleId: moderadorRole.id },
    });
    console.log(`Usuário moderador criado: ${adminEmail}`);
  }

  const categories = ['Alimentação', 'Material', 'Limpeza', 'Salários', 'Outros'];
  for (const name of categories) {
    const exists = await prisma.expenseCategory.findFirst({
      where: { tenantId: tenant.id, name },
    });
    if (!exists) {
      await prisma.expenseCategory.create({ data: { tenantId: tenant.id, name } });
    }
  }
  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
