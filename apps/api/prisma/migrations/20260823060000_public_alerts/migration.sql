-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNotifiedAt" TIMESTAMP(3),

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_deliveries" (
    "id" TEXT NOT NULL,
    "securityEventId" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "alert_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_hookId_identifier_key" ON "watchlists"("hookId", "identifier");

-- CreateIndex
CREATE INDEX "watchlists_identifier_idx" ON "watchlists"("identifier");

-- CreateIndex
CREATE INDEX "watchlists_hookId_idx" ON "watchlists"("hookId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_preferences_watchlistId_eventType_key" ON "alert_preferences"("watchlistId", "eventType");

-- CreateIndex
CREATE INDEX "alert_preferences_watchlistId_idx" ON "alert_preferences"("watchlistId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_deliveries_securityEventId_watchlistId_key" ON "alert_deliveries"("securityEventId", "watchlistId");

-- CreateIndex
CREATE INDEX "alert_deliveries_status_idx" ON "alert_deliveries"("status");

-- CreateIndex
CREATE INDEX "alert_deliveries_watchlistId_idx" ON "alert_deliveries"("watchlistId");

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "hooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_deliveries" ADD CONSTRAINT "alert_deliveries_securityEventId_fkey" FOREIGN KEY ("securityEventId") REFERENCES "security_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_deliveries" ADD CONSTRAINT "alert_deliveries_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
