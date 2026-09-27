-- CreateTable: MarketingJourney
CREATE TABLE "MarketingJourney" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JourneyExecution
CREATE TABLE "JourneyExecution" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "currentStepId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingJourney_restaurantId_trigger_enabled_idx" ON "MarketingJourney"("restaurantId", "trigger", "enabled");

-- CreateIndex
CREATE INDEX "MarketingJourney_restaurantId_createdAt_idx" ON "MarketingJourney"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "JourneyExecution_journeyId_status_idx" ON "JourneyExecution"("journeyId", "status");

-- CreateIndex
CREATE INDEX "JourneyExecution_guestId_idx" ON "JourneyExecution"("guestId");

-- CreateIndex
CREATE INDEX "JourneyExecution_status_idx" ON "JourneyExecution"("status");

-- AddForeignKey
ALTER TABLE "MarketingJourney" ADD CONSTRAINT "MarketingJourney_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyExecution" ADD CONSTRAINT "JourneyExecution_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "MarketingJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyExecution" ADD CONSTRAINT "JourneyExecution_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
