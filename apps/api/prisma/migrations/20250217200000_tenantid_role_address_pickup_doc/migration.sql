-- Role: tenantId obrigatório e unique por (tenantId, name)
UPDATE "Role" SET "tenantId" = (SELECT "id" FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "Role" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Role_name_key";
CREATE UNIQUE INDEX "Role_tenantId_name_key" ON "Role"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "Role_tenantId_idx" ON "Role"("tenantId");

-- ChildAddress: tenantId
ALTER TABLE "ChildAddress" ADD COLUMN "tenantId" TEXT;
UPDATE "ChildAddress" ca SET "tenantId" = (SELECT c."tenantId" FROM "Child" c WHERE c.id = ca."childId" LIMIT 1);
UPDATE "ChildAddress" SET "tenantId" = (SELECT "id" FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "ChildAddress" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ChildAddress_tenantId_idx" ON "ChildAddress"("tenantId");
ALTER TABLE "ChildAddress" ADD CONSTRAINT "ChildAddress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AuthorizedPickup: tenantId
ALTER TABLE "AuthorizedPickup" ADD COLUMN "tenantId" TEXT;
UPDATE "AuthorizedPickup" ap SET "tenantId" = (SELECT c."tenantId" FROM "Child" c WHERE c.id = ap."childId" LIMIT 1);
UPDATE "AuthorizedPickup" SET "tenantId" = (SELECT "id" FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "AuthorizedPickup" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "AuthorizedPickup_tenantId_idx" ON "AuthorizedPickup"("tenantId");
ALTER TABLE "AuthorizedPickup" ADD CONSTRAINT "AuthorizedPickup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChildDocument: tenantId
ALTER TABLE "ChildDocument" ADD COLUMN "tenantId" TEXT;
UPDATE "ChildDocument" cd SET "tenantId" = (SELECT c."tenantId" FROM "Child" c WHERE c.id = cd."childId" LIMIT 1);
UPDATE "ChildDocument" SET "tenantId" = (SELECT "id" FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "ChildDocument" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ChildDocument_tenantId_idx" ON "ChildDocument"("tenantId");
ALTER TABLE "ChildDocument" ADD CONSTRAINT "ChildDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PaymentMethod: add BOLETO (enum value)
ALTER TYPE "PaymentMethod" ADD VALUE 'BOLETO';
