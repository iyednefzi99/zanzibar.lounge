-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "Zone" AS ENUM ('TERRASSE', 'SALLE', 'SALON');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('WEB', 'WHATSAPP', 'SMS', 'PHONE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('GUEST', 'AGENT', 'STAFF');

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "zone" "Zone" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "zone" "Zone",
    "tableId" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "channel" "Channel" NOT NULL,
    "notes" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "confirmedByGuestAt" TIMESTAMP(3),
    "seatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "body" TEXT NOT NULL,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerification" (
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_phone_key" ON "Guest"("phone");

-- CreateIndex
CREATE INDEX "Guest_createdAt_idx" ON "Guest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_name_key" ON "RestaurantTable"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reference_key" ON "Reservation"("reference");

-- CreateIndex
CREATE INDEX "Reservation_serviceDate_status_idx" ON "Reservation"("serviceDate", "status");

-- CreateIndex
CREATE INDEX "Reservation_startsAt_status_idx" ON "Reservation"("startsAt", "status");

-- CreateIndex
CREATE INDEX "Reservation_guestId_startsAt_idx" ON "Reservation"("guestId", "startsAt");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_guestId_channel_key" ON "Conversation"("guestId", "channel");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneVerification_expiresAt_idx" ON "PhoneVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "ProcessedEvent_createdAt_idx" ON "ProcessedEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
