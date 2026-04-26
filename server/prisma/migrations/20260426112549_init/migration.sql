-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('verify', 'dispute');

-- CreateEnum
CREATE TYPE "EnvironmentalSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ReportLocationSource" AS ENUM ('exif', 'gps', 'manual');

-- CreateEnum
CREATE TYPE "ReportLitterType" AS ENUM ('plastic', 'metal', 'glass', 'organic', 'hazardous', 'other');

-- CreateEnum
CREATE TYPE "ReportQuantity" AS ENUM ('minimal', 'moderate', 'significant', 'severe');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('upcoming', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ReportVerificationStatus" AS ENUM ('pending', 'verified', 'disputed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('new_report', 'new_event', 'event_reminder', 'report_verified', 'report_disputed');

-- CreateEnum
CREATE TYPE "NotificationRelatedType" AS ENUM ('report', 'event');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,
    "password_hash" TEXT,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "impact_score" INTEGER DEFAULT 0,
    "notification_email" BOOLEAN DEFAULT true,
    "notification_in_app" BOOLEAN DEFAULT true,
    "areas_of_interest" JSONB,
    "clerk_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "location_source" "ReportLocationSource" NOT NULL,
    "photo_urls" JSONB NOT NULL,
    "photo_timestamp" TIMESTAMP(3),
    "litter_type" "ReportLitterType" NOT NULL,
    "quantity" "ReportQuantity" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "verification_status" "ReportVerificationStatus" DEFAULT 'pending',
    "cleaned_at" TIMESTAMP(3),
    "cleaned_by_user_id" UUID,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizer_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "location_name" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "EventStatus" DEFAULT 'upcoming',
    "participant_count" INTEGER DEFAULT 0,
    "litter_collected" DECIMAL(10,2),
    "photos" JSONB,
    "equipment_provided" BOOLEAN DEFAULT false,
    "required_items" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "registered_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "attended" BOOLEAN DEFAULT false,
    "litter_collected" DECIMAL(10,2),
    "contribution_note" TEXT,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "verification_type" "VerificationType" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_concerns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID NOT NULL,
    "concern_type" TEXT NOT NULL,
    "severity" "EnvironmentalSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environmental_concerns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotspots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "radius" DECIMAL(10,2) NOT NULL,
    "report_count" INTEGER NOT NULL,
    "severity_score" DECIMAL(5,2) NOT NULL,
    "last_report_date" TIMESTAMP(3) NOT NULL,
    "calculated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotspots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_id" UUID,
    "related_type" "NotificationRelatedType",
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "read" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_clerk_id_idx" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at");

-- CreateIndex
CREATE INDEX "reports_cleaned_at_idx" ON "reports"("cleaned_at");

-- CreateIndex
CREATE INDEX "reports_latitude_longitude_idx" ON "reports"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "reports_litter_type_idx" ON "reports"("litter_type");

-- CreateIndex
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");

-- CreateIndex
CREATE INDEX "reports_cleaned_by_user_id_idx" ON "reports"("cleaned_by_user_id");

-- CreateIndex
CREATE INDEX "events_scheduled_date_idx" ON "events"("scheduled_date");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_user_id_event_id_key" ON "event_registrations"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "verifications_user_id_idx" ON "verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_report_id_user_id_key" ON "verifications"("report_id", "user_id");

-- CreateIndex
CREATE INDEX "environmental_concerns_concern_type_idx" ON "environmental_concerns"("concern_type");

-- CreateIndex
CREATE INDEX "environmental_concerns_report_id_idx" ON "environmental_concerns"("report_id");

-- CreateIndex
CREATE INDEX "hotspots_severity_score_idx" ON "hotspots"("severity_score");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_latitude_longitude_idx" ON "notifications"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_cleaned_by_user_id_fkey" FOREIGN KEY ("cleaned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_concerns" ADD CONSTRAINT "environmental_concerns_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
