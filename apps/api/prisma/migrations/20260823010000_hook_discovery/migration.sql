-- AlterTable
ALTER TABLE "hooks" ADD COLUMN "firstSeenBlock" BIGINT;
ALTER TABLE "hooks" ADD COLUMN "lastSeenBlock" BIGINT;
ALTER TABLE "hooks" ADD COLUMN "poolCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "hooks" ADD COLUMN "lastIndexedAt" TIMESTAMP(3);

UPDATE "hooks"
SET
  "firstSeenBlock" = "deploymentBlock",
  "lastSeenBlock" = "deploymentBlock"
WHERE "firstSeenBlock" IS NULL;

ALTER TABLE "hooks" ALTER COLUMN "firstSeenBlock" SET NOT NULL;
ALTER TABLE "hooks" ALTER COLUMN "lastSeenBlock" SET NOT NULL;

CREATE INDEX "hooks_lastIndexedAt_idx" ON "hooks"("lastIndexedAt");

-- AlterTable
ALTER TABLE "pools" ADD COLUMN "token0Address" TEXT;
ALTER TABLE "pools" ADD COLUMN "token1Address" TEXT;
ALTER TABLE "pools" ADD COLUMN "token0Symbol" TEXT;
ALTER TABLE "pools" ADD COLUMN "token1Symbol" TEXT;
ALTER TABLE "pools" ADD COLUMN "createdAtBlock" BIGINT;
ALTER TABLE "pools" ADD COLUMN "currencyPair" TEXT;

UPDATE "pools"
SET
  "token0Address" = "token0",
  "token1Address" = "token1",
  "createdAtBlock" = "createdBlock",
  "currencyPair" = "token0" || '/' || "token1"
WHERE "token0Address" IS NULL;

ALTER TABLE "pools" ALTER COLUMN "token0Address" SET NOT NULL;
ALTER TABLE "pools" ALTER COLUMN "token1Address" SET NOT NULL;
ALTER TABLE "pools" ALTER COLUMN "createdAtBlock" SET NOT NULL;
ALTER TABLE "pools" ALTER COLUMN "currencyPair" SET NOT NULL;

-- CreateTable
CREATE TABLE "indexer_checkpoints" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "lastProcessedBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_checkpoints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "indexer_checkpoints_chainId_contractAddress_key" ON "indexer_checkpoints"("chainId", "contractAddress");
CREATE INDEX "indexer_checkpoints_chainId_idx" ON "indexer_checkpoints"("chainId");
