-- AlterTable
ALTER TABLE "findings" ADD COLUMN "confidence" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "findings" ADD COLUMN "detectionSource" TEXT NOT NULL DEFAULT 'BYTECODE_OPCODE';
ALTER TABLE "findings" ADD COLUMN "validationStatus" TEXT NOT NULL DEFAULT 'UNREVIEWED';
ALTER TABLE "findings" ADD COLUMN "validatedAt" TIMESTAMP(3);
ALTER TABLE "findings" ADD COLUMN "validationNotes" TEXT;

CREATE INDEX "findings_confidence_idx" ON "findings"("confidence");
CREATE INDEX "findings_validationStatus_idx" ON "findings"("validationStatus");
