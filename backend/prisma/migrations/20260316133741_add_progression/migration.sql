-- AlterTable
ALTER TABLE "training_logs" ADD COLUMN     "progression_confirmed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_exercise_weights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "current_weight" DECIMAL(8,2) NOT NULL,
    "weight_unit" VARCHAR(20) NOT NULL DEFAULT 'kg',
    "preferred_increment_pct" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_exercise_weights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_exercise_weights_user_id_idx" ON "user_exercise_weights"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_exercise_weights_user_id_exercise_id_key" ON "user_exercise_weights"("user_id", "exercise_id");

-- AddForeignKey
ALTER TABLE "user_exercise_weights" ADD CONSTRAINT "user_exercise_weights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exercise_weights" ADD CONSTRAINT "user_exercise_weights_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
