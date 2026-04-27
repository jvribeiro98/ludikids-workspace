import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ROLES = ['MODERADOR', 'ADMINISTRADOR', 'COORDENACAO', 'PROFESSOR'] as const;
type RoleName = (typeof ROLES)[number];

async function ensureUserWithRole(params: {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  role: RoleName;
}) {
  const { tenantId, email, password, name, role } = params;

  const roleEntity = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId, name: role as any } },
  });
  if (!roleEntity) throw new Error(`Role ${role} não encontrada.`);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await argon2.hash(password);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        tenantId,
      },
    });
    console.log(`Usuário criado: ${email}`);
  } else {
    console.log(`Usuário já existe: ${email}`);
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: roleEntity.id,
      },
    },
    create: {
      userId: user.id,
      roleId: roleEntity.id,
    },
    update: {},
  });

  return user;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ludikids.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const testUserEmail = process.env.TEST_USER_EMAIL || 'teste@ludikids.com.br';
  const testUserPassword = process.env.TEST_USER_PASSWORD || 'Teste@123';
  const createTestUser = process.env.CREATE_TEST_USER !== 'false';

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
      where: { tenantId_name: { tenantId: tenant.id, name: name as any } },
      create: { name: name as any, tenantId: tenant.id },
      update: {},
    });
  }
  console.log('Roles criadas.');

  await ensureUserWithRole({
    tenantId: tenant.id,
    email: adminEmail,
    password: adminPassword,
    name: 'Administrador',
    role: 'MODERADOR',
  });

  if (createTestUser) {
    await ensureUserWithRole({
      tenantId: tenant.id,
      email: testUserEmail,
      password: testUserPassword,
      name: 'Usuário de Teste',
      role: 'COORDENACAO',
    });
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
