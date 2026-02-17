-- Guardian.tenantId
ALTER TABLE "Guardian" ADD COLUMN "tenantId" TEXT;

UPDATE "Guardian" g
SET "tenantId" = (
  SELECT c."tenantId" FROM "Child" c
  INNER JOIN "ChildGuardian" cg ON cg."childId" = c.id
  WHERE cg."guardianId" = g.id
  LIMIT 1
);

UPDATE "Guardian" SET "tenantId" = (SELECT "id" FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;

ALTER TABLE "Guardian" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Guardian_tenantId_idx" ON "Guardian"("tenantId");
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CoordinationInboxItem.tenantId
ALTER TABLE "CoordinationInboxItem" ADD COLUMN "tenantId" TEXT;

UPDATE "CoordinationInboxItem" ci
SET "tenantId" = (SELECT c."tenantId" FROM "Child" c WHERE c.id = ci."childId" LIMIT 1)
WHERE ci."childId" IS NOT NULL;

UPDATE "CoordinationInboxItem" ci
SET "tenantId" = (
  SELECT c."tenantId" FROM "DailyLogItem" dli
  INNER JOIN "Child" c ON c.id = dli."childId"
  WHERE dli.id = ci."dailyLogItemId"
  LIMIT 1
)
WHERE ci."tenantId" IS NULL AND ci."dailyLogItemId" IS NOT NULL;

UPDATE "CoordinationInboxItem" SET "tenantId" = (SELECT "id" FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;

ALTER TABLE "CoordinationInboxItem" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "CoordinationInboxItem_tenantId_idx" ON "CoordinationInboxItem"("tenantId");
ALTER TABLE "CoordinationInboxItem" ADD CONSTRAINT "CoordinationInboxItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
