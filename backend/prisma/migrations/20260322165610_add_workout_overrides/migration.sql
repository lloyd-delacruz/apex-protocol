-- AlterTable
ALTER TABLE "body_metrics" ADD COLUMN     "body_fat" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "user_program_assignments" ADD COLUMN     "override_workout_date" DATE,
ADD COLUMN     "override_workout_day_id" UUID;
