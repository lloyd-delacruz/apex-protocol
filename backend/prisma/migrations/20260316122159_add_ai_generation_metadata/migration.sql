-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "total_weeks" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "author_id" TEXT,
    "goal_type" VARCHAR(50),
    "experience_level" VARCHAR(50),
    "days_per_week" INTEGER,
    "equipment_list" TEXT[],
    "source_type" VARCHAR(50) NOT NULL DEFAULT 'system',

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_months" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "month_number" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_weeks" (
    "id" TEXT NOT NULL,
    "program_month_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "absolute_week_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_days" (
    "id" TEXT NOT NULL,
    "program_week_id" TEXT NOT NULL,
    "day_code" VARCHAR(20) NOT NULL,
    "phase" VARCHAR(50) NOT NULL,
    "workout_type" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "muscle_group" VARCHAR(100),
    "equipment" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_substitutions" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "substitute_exercise_id" TEXT NOT NULL,
    "priority_rank" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_prescriptions" (
    "id" TEXT NOT NULL,
    "workout_day_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "target_rep_range" VARCHAR(50),
    "increment_value" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "increment_unit" VARCHAR(20) NOT NULL DEFAULT 'lb',
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_program_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_program_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT,
    "program_week_id" TEXT,
    "workout_day_id" TEXT,
    "exercise_prescription_id" TEXT,
    "exercise_id" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "weight" DECIMAL(8,2),
    "weight_unit" VARCHAR(20) NOT NULL DEFAULT 'lb',
    "set_1_reps" INTEGER,
    "set_2_reps" INTEGER,
    "set_3_reps" INTEGER,
    "set_4_reps" INTEGER,
    "rir" INTEGER,
    "total_reps" INTEGER,
    "lower_rep" INTEGER,
    "upper_rep" INTEGER,
    "ready_to_increase" BOOLEAN,
    "next_weight" DECIMAL(8,2),
    "status" VARCHAR(20),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entry_date" DATE NOT NULL,
    "body_weight" DECIMAL(6,2),
    "body_weight_unit" VARCHAR(20) NOT NULL DEFAULT 'kg',
    "calories" INTEGER,
    "protein_grams" INTEGER,
    "sleep_hours" DECIMAL(4,2),
    "hunger_score" INTEGER,
    "binge_urge_score" INTEGER,
    "mood_score" INTEGER,
    "training_performance_score" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "program_months_program_id_month_number_key" ON "program_months"("program_id", "month_number");

-- CreateIndex
CREATE UNIQUE INDEX "program_weeks_program_month_id_week_number_key" ON "program_weeks"("program_month_id", "week_number");

-- CreateIndex
CREATE INDEX "workout_days_program_week_id_idx" ON "workout_days"("program_week_id");

-- CreateIndex
CREATE INDEX "workout_days_sort_order_idx" ON "workout_days"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_substitutions_exercise_id_substitute_exercise_id_key" ON "exercise_substitutions"("exercise_id", "substitute_exercise_id");

-- CreateIndex
CREATE INDEX "exercise_prescriptions_workout_day_id_idx" ON "exercise_prescriptions"("workout_day_id");

-- CreateIndex
CREATE INDEX "exercise_prescriptions_exercise_id_idx" ON "exercise_prescriptions"("exercise_id");

-- CreateIndex
CREATE INDEX "exercise_prescriptions_sort_order_idx" ON "exercise_prescriptions"("sort_order");

-- CreateIndex
CREATE INDEX "user_program_assignments_user_id_idx" ON "user_program_assignments"("user_id");

-- CreateIndex
CREATE INDEX "user_program_assignments_program_id_idx" ON "user_program_assignments"("program_id");

-- CreateIndex
CREATE INDEX "training_logs_user_id_idx" ON "training_logs"("user_id");

-- CreateIndex
CREATE INDEX "training_logs_session_date_idx" ON "training_logs"("session_date");

-- CreateIndex
CREATE INDEX "training_logs_exercise_id_idx" ON "training_logs"("exercise_id");

-- CreateIndex
CREATE INDEX "training_logs_status_idx" ON "training_logs"("status");

-- CreateIndex
CREATE INDEX "training_logs_user_id_session_date_idx" ON "training_logs"("user_id", "session_date");

-- CreateIndex
CREATE INDEX "training_logs_user_id_exercise_id_session_date_idx" ON "training_logs"("user_id", "exercise_id", "session_date");

-- CreateIndex
CREATE INDEX "body_metrics_user_id_idx" ON "body_metrics"("user_id");

-- CreateIndex
CREATE INDEX "body_metrics_entry_date_idx" ON "body_metrics"("entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "body_metrics_user_id_entry_date_key" ON "body_metrics"("user_id", "entry_date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_months" ADD CONSTRAINT "program_months_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_weeks" ADD CONSTRAINT "program_weeks_program_month_id_fkey" FOREIGN KEY ("program_month_id") REFERENCES "program_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_program_week_id_fkey" FOREIGN KEY ("program_week_id") REFERENCES "program_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_substitutions" ADD CONSTRAINT "exercise_substitutions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_substitutions" ADD CONSTRAINT "exercise_substitutions_substitute_exercise_id_fkey" FOREIGN KEY ("substitute_exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_prescriptions" ADD CONSTRAINT "exercise_prescriptions_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_prescriptions" ADD CONSTRAINT "exercise_prescriptions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_program_assignments" ADD CONSTRAINT "user_program_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_program_assignments" ADD CONSTRAINT "user_program_assignments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_program_week_id_fkey" FOREIGN KEY ("program_week_id") REFERENCES "program_weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_exercise_prescription_id_fkey" FOREIGN KEY ("exercise_prescription_id") REFERENCES "exercise_prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
