-- CreateTable
CREATE TABLE "hooks" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "creator" TEXT NOT NULL,
    "deploymentBlock" BIGINT NOT NULL,
    "verifiedSource" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "hookAddress" TEXT NOT NULL,
    "token0" TEXT NOT NULL,
    "token1" TEXT NOT NULL,
    "fee" INTEGER NOT NULL,
    "tickSpacing" INTEGER NOT NULL,
    "createdBlock" BIGINT NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "bytecode" TEXT NOT NULL,
    "sourceCode" TEXT,
    "compilerVersion" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("address","chainId")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hooks_address_chainId_key" ON "hooks"("address", "chainId");

-- CreateIndex
CREATE INDEX "hooks_chainId_idx" ON "hooks"("chainId");

-- CreateIndex
CREATE INDEX "hooks_riskScore_idx" ON "hooks"("riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "pools_poolId_chainId_key" ON "pools"("poolId", "chainId");

-- CreateIndex
CREATE INDEX "pools_hookAddress_chainId_idx" ON "pools"("hookAddress", "chainId");

-- CreateIndex
CREATE INDEX "findings_hookId_idx" ON "findings"("hookId");

-- CreateIndex
CREATE INDEX "findings_severity_idx" ON "findings"("severity");

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_hookAddress_chainId_fkey" FOREIGN KEY ("hookAddress", "chainId") REFERENCES "hooks"("address", "chainId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "hooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
