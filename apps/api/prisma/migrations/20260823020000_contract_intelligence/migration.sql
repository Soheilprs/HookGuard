-- AlterTable
ALTER TABLE "contracts" ADD COLUMN "id" TEXT;
UPDATE "contracts" SET "id" = concat("address", ':', "chainId"::text) WHERE "id" IS NULL;
ALTER TABLE "contracts" ALTER COLUMN "id" SET NOT NULL;

ALTER TABLE "contracts" DROP CONSTRAINT "contracts_pkey";
CREATE UNIQUE INDEX "contracts_address_chainId_key" ON "contracts"("address", "chainId");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");

ALTER TABLE "contracts" ADD COLUMN "bytecodeHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "contracts" ADD COLUMN "sourceVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "contracts" ADD COLUMN "abiJson" TEXT;
ALTER TABLE "contracts" ADD COLUMN "isProxy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "implementationAddress" TEXT;
ALTER TABLE "contracts" ADD COLUMN "adminAddress" TEXT;
ALTER TABLE "contracts" ADD COLUMN "lastCheckedAt" TIMESTAMP(3);

CREATE INDEX "contracts_chainId_idx" ON "contracts"("chainId");

-- CreateTable
CREATE TABLE "contract_functions" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "stateMutability" TEXT NOT NULL,

    CONSTRAINT "contract_functions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contract_functions_contractId_selector_key" ON "contract_functions"("contractId", "selector");
CREATE INDEX "contract_functions_contractId_idx" ON "contract_functions"("contractId");

ALTER TABLE "contract_functions" ADD CONSTRAINT "contract_functions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "contract_permissions" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "contract_permissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contract_permissions_contractId_idx" ON "contract_permissions"("contractId");

ALTER TABLE "contract_permissions" ADD CONSTRAINT "contract_permissions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
