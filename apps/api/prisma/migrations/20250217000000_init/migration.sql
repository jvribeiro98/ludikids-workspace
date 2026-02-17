-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('MODERADOR', 'ADMINISTRADOR', 'COORDENACAO', 'PROFESSOR');
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CASH', 'CARD', 'TRANSFER', 'OTHER');
CREATE TYPE "InboxStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONTACTED');
CREATE TYPE "PunchType" AS ENUM ('ENTRY', 'EXIT');
CREATE TYPE "MessageRuleTrigger" AS ENUM ('D_MINUS_2', 'D_0', 'D_PLUS_10', 'OVERDUE');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "DocumentType" AS ENUM ('PLANO_SAUDE', 'LAUDO', 'CONTRATO', 'OUTRO');
CREATE TYPE "AuthorizedPickupType" AS ENUM ('PERSON', 'TRANSPORTE_ESCOLAR');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geofenceRadiusMeters" INTEGER DEFAULT 200,
    "dueDayDefault" INTEGER DEFAULT 10,
    "lateFeePercent" DECIMAL(5,2) DEFAULT 2,
    "interestPercentPerMonth" DECIMAL(5,2) DEFAULT 1,
    "lateFeeMaxPercent" DECIMAL(5,2) DEFAULT 10,
    "punctualityDiscountPercent" DECIMAL(5,2) DEFAULT 5,
    "siblingDiscountPercent" DECIMAL(5,2) DEFAULT 10,
    "siblingMaxCount" INTEGER DEFAULT 2,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refreshToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCycle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "hireDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trigger" "MessageRuleTrigger" NOT NULL,
    "templateId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildGuardian" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relation" TEXT,
    "isResponsible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildAddress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "label" TEXT,
    "street" TEXT NOT NULL,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizedPickup" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" "AuthorizedPickupType" NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorizedPickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildDocument" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "dueDay" INTEGER NOT NULL,
    "punctualityDiscount" BOOLEAN NOT NULL DEFAULT true,
    "siblingDiscount" BOOLEAN NOT NULL DEFAULT false,
    "siblingCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractService" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "billingCycleId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lateFeeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "punctualityApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "attachmentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLogItem" (
    "id" TEXT NOT NULL,
    "dailyLogId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "bath" BOOLEAN,
    "feeding" TEXT,
    "sleepMinutes" INTEGER,
    "snack" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "dailyLogItemId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoordinationInboxItem" (
    "id" TEXT NOT NULL,
    "dailyLogItemId" TEXT,
    "childId" TEXT,
    "status" "InboxStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "contactedGuardian" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoordinationInboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeClockEvent" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "type" "PunchType" NOT NULL,
    "punchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeClockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageOutbox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "phone" TEXT NOT NULL,
    "templateCode" TEXT,
    "body" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE UNIQUE INDEX "BillingCycle_tenantId_year_month_key" ON "BillingCycle"("tenantId", "year", "month");
CREATE UNIQUE INDEX "ChildGuardian_childId_guardianId_key" ON "ChildGuardian"("childId", "guardianId");
CREATE UNIQUE INDEX "ContractService_contractId_serviceId_key" ON "ContractService"("contractId", "serviceId");
CREATE UNIQUE INDEX "Invoice_billingCycleId_childId_key" ON "Invoice"("billingCycleId", "childId");
CREATE UNIQUE INDEX "MessageTemplate_tenantId_code_key" ON "MessageTemplate"("tenantId", "code");
CREATE UNIQUE INDEX "MessageRule_tenantId_trigger_key" ON "MessageRule"("tenantId", "trigger");
CREATE UNIQUE INDEX "DailyLog_classId_date_key" ON "DailyLog"("classId", "date");
CREATE UNIQUE INDEX "DailyLogItem_dailyLogId_childId_key" ON "DailyLogItem"("dailyLogId", "childId");
CREATE UNIQUE INDEX "WorkSchedule_staffProfileId_dayOfWeek_key" ON "WorkSchedule"("staffProfileId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "Child_tenantId_idx" ON "Child"("tenantId");
CREATE INDEX "Child_classId_idx" ON "Child"("classId");
CREATE INDEX "ChildAddress_childId_idx" ON "ChildAddress"("childId");
CREATE INDEX "AuthorizedPickup_childId_idx" ON "AuthorizedPickup"("childId");
CREATE INDEX "ChildDocument_childId_idx" ON "ChildDocument"("childId");
CREATE INDEX "Contract_tenantId_idx" ON "Contract"("tenantId");
CREATE INDEX "Contract_childId_idx" ON "Contract"("childId");
CREATE INDEX "Contract_startDate_endDate_idx" ON "Contract"("startDate", "endDate");
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Expense_tenantId_idx" ON "Expense"("tenantId");
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");
CREATE INDEX "Expense_date_idx" ON "Expense"("date");
CREATE INDEX "DailyLog_classId_idx" ON "DailyLog"("classId");
CREATE INDEX "DailyLog_date_idx" ON "DailyLog"("date");
CREATE INDEX "DailyLogItem_dailyLogId_idx" ON "DailyLogItem"("dailyLogId");
CREATE INDEX "DailyLogItem_childId_idx" ON "DailyLogItem"("childId");
CREATE INDEX "Incident_dailyLogItemId_idx" ON "Incident"("dailyLogItemId");
CREATE INDEX "CoordinationInboxItem_status_idx" ON "CoordinationInboxItem"("status");
CREATE INDEX "CoordinationInboxItem_dailyLogItemId_idx" ON "CoordinationInboxItem"("dailyLogItemId");
CREATE INDEX "CoordinationInboxItem_childId_idx" ON "CoordinationInboxItem"("childId");
CREATE INDEX "WorkSchedule_staffProfileId_idx" ON "WorkSchedule"("staffProfileId");
CREATE INDEX "TimeClockEvent_staffProfileId_idx" ON "TimeClockEvent"("staffProfileId");
CREATE INDEX "TimeClockEvent_punchedAt_idx" ON "TimeClockEvent"("punchedAt");
CREATE INDEX "Alert_tenantId_idx" ON "Alert"("tenantId");
CREATE INDEX "Alert_type_idx" ON "Alert"("type");
CREATE INDEX "Alert_readAt_idx" ON "Alert"("readAt");
CREATE INDEX "MessageOutbox_tenantId_idx" ON "MessageOutbox"("tenantId");
CREATE INDEX "MessageOutbox_status_idx" ON "MessageOutbox"("status");
CREATE INDEX "MessageOutbox_createdAt_idx" ON "MessageOutbox"("createdAt");
CREATE INDEX "BackupRun_tenantId_idx" ON "BackupRun"("tenantId");
CREATE INDEX "BackupRun_createdAt_idx" ON "BackupRun"("createdAt");
CREATE INDEX "Class_tenantId_idx" ON "Class"("tenantId");
CREATE INDEX "Service_tenantId_idx" ON "Service"("tenantId");
CREATE INDEX "ExpenseCategory_tenantId_idx" ON "ExpenseCategory"("tenantId");
CREATE INDEX "MessageRule_tenantId_idx" ON "MessageRule"("tenantId");
CREATE INDEX "StaffProfile_tenantId_idx" ON "StaffProfile"("tenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Child" ADD CONSTRAINT "Child_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Child" ADD CONSTRAINT "Child_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChildGuardian" ADD CONSTRAINT "ChildGuardian_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChildGuardian" ADD CONSTRAINT "ChildGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChildAddress" ADD CONSTRAINT "ChildAddress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthorizedPickup" ADD CONSTRAINT "AuthorizedPickup_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChildDocument" ADD CONSTRAINT "ChildDocument_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Class" ADD CONSTRAINT "Class_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractService" ADD CONSTRAINT "ContractService_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractService" ADD CONSTRAINT "ContractService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingCycle" ADD CONSTRAINT "BillingCycle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billingCycleId_fkey" FOREIGN KEY ("billingCycleId") REFERENCES "BillingCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyLogItem" ADD CONSTRAINT "DailyLogItem_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyLogItem" ADD CONSTRAINT "DailyLogItem_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_dailyLogItemId_fkey" FOREIGN KEY ("dailyLogItemId") REFERENCES "DailyLogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoordinationInboxItem" ADD CONSTRAINT "CoordinationInboxItem_dailyLogItemId_fkey" FOREIGN KEY ("dailyLogItemId") REFERENCES "DailyLogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoordinationInboxItem" ADD CONSTRAINT "CoordinationInboxItem_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeClockEvent" ADD CONSTRAINT "TimeClockEvent_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageRule" ADD CONSTRAINT "MessageRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageRule" ADD CONSTRAINT "MessageRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageOutbox" ADD CONSTRAINT "MessageOutbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageOutbox" ADD CONSTRAINT "MessageOutbox_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
