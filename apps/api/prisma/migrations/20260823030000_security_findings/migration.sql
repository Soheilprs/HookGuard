-- AlterTable
ALTER TABLE "findings" ADD COLUMN "ruleId" TEXT;
ALTER TABLE "findings" ADD COLUMN "title" TEXT;
ALTER TABLE "findings" ADD COLUMN "evidence" JSONB;

UPDATE "findings"
SET
  "ruleId" = coalesce("ruleId", "id"),
  "title" = coalesce("title", 'Finding'),
  "evidence" = coalesce("evidence", '{}'::jsonb)
WHERE "ruleId" IS NULL OR "title" IS NULL OR "evidence" IS NULL;

ALTER TABLE "findings" ALTER COLUMN "ruleId" SET NOT NULL;
ALTER TABLE "findings" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "findings" ALTER COLUMN "evidence" SET NOT NULL;

CREATE UNIQUE INDEX "findings_hookId_ruleId_key" ON "findings"("hookId", "ruleId");
CREATE INDEX "findings_ruleId_idx" ON "findings"("ruleId");
