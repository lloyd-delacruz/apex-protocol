-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "body_part" VARCHAR(100),
ADD COLUMN     "difficulty" VARCHAR(50),
ADD COLUMN     "exercise_type" VARCHAR(50),
ADD COLUMN     "goal_tags" JSONB,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "is_compound" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_unilateral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "media_url" VARCHAR(500),
ADD COLUMN     "movement_pattern" VARCHAR(100),
ADD COLUMN     "primary_muscle" VARCHAR(100),
ADD COLUMN     "secondary_muscles" JSONB,
ADD COLUMN     "video_url" VARCHAR(500);

-- CreateIndex
CREATE INDEX "exercises_movement_pattern_idx" ON "exercises"("movement_pattern");

-- CreateIndex
CREATE INDEX "exercises_exercise_type_idx" ON "exercises"("exercise_type");

-- CreateIndex
CREATE INDEX "exercises_difficulty_idx" ON "exercises"("difficulty");
