-- Migration: add_exercise_external_source
-- Purpose: Extend the exercises table to support data imported from ExerciseDB
--          (RapidAPI) and any future external exercise sources.
--
-- All new columns are nullable so existing rows are untouched.
-- The composite unique index allows multiple NULL pairs (PostgreSQL treats each
-- NULL as distinct), so legacy exercises with no external source are unaffected.

-- AlterTable: add external source tracking columns
ALTER TABLE "exercises"
  ADD COLUMN "external_id"     VARCHAR(255),
  ADD COLUMN "external_source" VARCHAR(100),
  ADD COLUMN "last_synced_at"  TIMESTAMP(3);

-- CreateIndex: fast lookup by source during import deduplication
CREATE INDEX "exercises_external_source_idx" ON "exercises"("external_source");

-- CreateIndex: prevent duplicate imports from the same source
-- NULL values do not conflict in PostgreSQL unique indexes, so existing rows
-- (external_id = NULL, external_source = NULL) are all considered distinct.
CREATE UNIQUE INDEX "exercises_external_id_external_source_key"
  ON "exercises"("external_id", "external_source");
