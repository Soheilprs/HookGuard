-- AlterTable
ALTER TABLE "findings" ADD COLUMN "sourceLocation" TEXT;
ALTER TABLE "findings" ADD COLUMN "functionName" TEXT;
ALTER TABLE "findings" ADD COLUMN "codeSnippet" TEXT;
ALTER TABLE "findings" ADD COLUMN "analysisType" TEXT;
