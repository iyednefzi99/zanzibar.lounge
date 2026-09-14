-- AlterTable: Add 2FA fields to Staff
ALTER TABLE "Staff" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Staff" ADD COLUMN "twoFactorSecret" TEXT;

-- AlterTable: Add name and delivery tracking to WebhookEndpoint
ALTER TABLE "WebhookEndpoint" ADD COLUMN "name" TEXT;
ALTER TABLE "WebhookEndpoint" ADD COLUMN "lastDeliveryAt" TIMESTAMP(3);
ALTER TABLE "WebhookEndpoint" ADD COLUMN "lastDeliveryStatus" TEXT;

-- CreateTable: WebhookDelivery
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "responseStatus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ApiKey
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_createdAt_idx" ON "WebhookDelivery"("webhookId", "createdAt");
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

CREATE INDEX "AuditLog_restaurantId_createdAt_idx" ON "AuditLog"("restaurantId", "createdAt");
CREATE INDEX "AuditLog_restaurantId_action_idx" ON "AuditLog"("restaurantId", "action");

CREATE INDEX "ApiKey_restaurantId_idx" ON "ApiKey"("restaurantId");
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
