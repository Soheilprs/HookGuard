-- CreateTable
CREATE TABLE "hook_snapshots" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "implementationAddress" TEXT,
    "adminAddress" TEXT,
    "ownerAddress" TEXT,
    "bytecodeHash" TEXT NOT NULL,
    "functionsHash" TEXT NOT NULL,
    "permissionsHash" TEXT NOT NULL,
    "functionsJson" JSONB NOT NULL DEFAULT '[]',
    "permissionsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hook_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hook_snapshots_hookId_createdAt_idx" ON "hook_snapshots"("hookId", "createdAt");

-- CreateIndex
CREATE INDEX "hook_snapshots_createdAt_idx" ON "hook_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "security_events_hookId_detectedAt_idx" ON "security_events"("hookId", "detectedAt");

-- CreateIndex
CREATE INDEX "security_events_type_idx" ON "security_events"("type");

-- AddForeignKey
ALTER TABLE "hook_snapshots" ADD CONSTRAINT "hook_snapshots_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "hooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "hooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
