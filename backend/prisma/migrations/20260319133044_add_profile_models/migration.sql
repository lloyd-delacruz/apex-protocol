-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gender" VARCHAR(50),
    "date_of_birth" DATE,
    "height_value" DECIMAL(6,2),
    "height_unit" VARCHAR(10) NOT NULL DEFAULT 'cm',
    "weight_value" DECIMAL(6,2),
    "weight_unit" VARCHAR(10) NOT NULL DEFAULT 'kg',
    "preferred_weight_unit" VARCHAR(10) NOT NULL DEFAULT 'lb',
    "apple_health_connected" BOOLEAN NOT NULL DEFAULT false,
    "last_health_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "goal" VARCHAR(50),
    "consistency" VARCHAR(50),
    "experience" VARCHAR(50),
    "environment" VARCHAR(50),
    "workouts_per_week" INTEGER,
    "specific_days" JSONB,
    "body_stats_snapshot" JSONB,
    "notification_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "notification_time" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workout_preview_enabled" BOOLEAN NOT NULL DEFAULT false,
    "workout_preview_time" TEXT,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "onboarding_profile_id" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "environment_type" VARCHAR(50),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_profile_items" (
    "id" TEXT NOT NULL,
    "equipment_profile_id" TEXT NOT NULL,
    "equipment_code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_profile_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profiles_user_id_key" ON "onboarding_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_profiles" ADD CONSTRAINT "equipment_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_profiles" ADD CONSTRAINT "equipment_profiles_onboarding_profile_id_fkey" FOREIGN KEY ("onboarding_profile_id") REFERENCES "onboarding_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_profile_items" ADD CONSTRAINT "equipment_profile_items_equipment_profile_id_fkey" FOREIGN KEY ("equipment_profile_id") REFERENCES "equipment_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
