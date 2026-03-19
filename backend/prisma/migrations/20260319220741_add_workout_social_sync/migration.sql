-- AlterTable
ALTER TABLE "workout_sessions" ADD COLUMN     "post_to_fitbit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "post_to_strava" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sync_to_apple_health" BOOLEAN NOT NULL DEFAULT false;
