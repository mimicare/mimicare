CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'LOGIN', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'TWO_FACTOR_AUTH');

-- CreateEnum
CREATE TYPE "CountryCode" AS ENUM ('IN', 'US', 'GB');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PreferredLanguage" AS ENUM ('ENGLISH', 'HINDI', 'TAMIL');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LOGIN', 'VITALS_ENTRY', 'APPOINTMENT_BOOKED', 'STREAK_COMPLETED', 'POST_CREATED', 'MESSAGE_SENT', 'MILESTONE_ACHIEVED', 'VACCINE_ADMINISTERED', 'DAILY_LOG_COMPLETED', 'ARTICLE_READ', 'VIDEO_WATCHED', 'REEL_POSTED');

-- CreateEnum
CREATE TYPE "LifeStage" AS ENUM ('PUBERTY', 'REPRODUCTIVE', 'PERIMENOPAUSE', 'POSTMENOPAUSE');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('PARTNER', 'GUARDIAN', 'CAREGIVER', 'SIBLING', 'FRIEND');

-- CreateEnum
CREATE TYPE "MedicalCouncil" AS ENUM ('MCI', 'NMC', 'STATE_COUNCIL');

-- CreateEnum
CREATE TYPE "DoctorSpecialization" AS ENUM ('OBSTETRICIAN_GYNECOLOGIST', 'GYNECOLOGIST', 'MATERNAL_FETAL_MEDICINE', 'PEDIATRICIAN', 'GENERAL_PRACTITIONER', 'NEONATOLOGIST', 'CHILD_SPECIALIST', 'ENDOCRINOLOGIST', 'NUTRITIONIST', 'MENTAL_HEALTH');

-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('IN_PERSON', 'VIDEO', 'CHAT', 'PHONE');

-- CreateEnum
CREATE TYPE "AbdmConsentStatus" AS ENUM ('REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VitalsSource" AS ENUM ('MANUAL_ENTRY', 'CLINIC_MEASUREMENT', 'IMPORTED', 'WEARABLE_DEVICE');

-- CreateEnum
CREATE TYPE "CervicalMucus" AS ENUM ('NONE', 'STICKY', 'CREAMY', 'WATERY', 'EGGWHITE');

-- CreateEnum
CREATE TYPE "ReproductiveCondition" AS ENUM ('PCOS', 'ENDOMETRIOSIS', 'THYROID_DISORDER', 'FIBROIDS', 'ADENOMYOSIS', 'PREMATURE_OVARIAN_FAILURE', 'NONE');

-- CreateEnum
CREATE TYPE "MoodLevel" AS ENUM ('VERY_HAPPY', 'HAPPY', 'NEUTRAL', 'SAD', 'VERY_SAD', 'ANXIOUS', 'IRRITABLE');

-- CreateEnum
CREATE TYPE "PainLevel" AS ENUM ('NONE', 'MILD', 'MODERATE', 'SEVERE', 'UNBEARABLE');

-- CreateEnum
CREATE TYPE "FlowType" AS ENUM ('SPOTTING', 'LIGHT', 'MEDIUM', 'HEAVY', 'VERY_HEAVY');

-- CreateEnum
CREATE TYPE "MenopauseSymptom" AS ENUM ('HOT_FLASHES', 'NIGHT_SWEATS', 'INSOMNIA', 'MOOD_SWINGS', 'BRAIN_FOG', 'VAGINAL_DRYNESS', 'JOINT_PAIN', 'WEIGHT_GAIN');

-- CreateEnum
CREATE TYPE "PregnancyStatus" AS ENUM ('TRYING_TO_CONCEIVE', 'PREGNANT', 'POSTPARTUM', 'NOT_PREGNANT');

-- CreateEnum
CREATE TYPE "PregnancyRiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "DeliveryOutcome" AS ENUM ('LIVE_BIRTH', 'STILLBIRTH', 'MISCARRIAGE', 'ONGOING');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('VAGINAL_NORMAL', 'VAGINAL_ASSISTED', 'CESAREAN_PLANNED', 'CESAREAN_EMERGENCY');

-- CreateEnum
CREATE TYPE "PeriodFlowIntensity" AS ENUM ('SPOTTING', 'LIGHT', 'MEDIUM', 'HEAVY');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "VaccineStatus" AS ENUM ('UPCOMING', 'OVERDUE', 'ADMINISTERED', 'SKIPPED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "MilestoneCategory" AS ENUM ('MOTOR_GROSS', 'MOTOR_FINE', 'LANGUAGE', 'COGNITIVE', 'SOCIAL', 'EMOTIONAL');

-- CreateEnum
CREATE TYPE "MedicalDocumentType" AS ENUM ('LAB_REPORT', 'ULTRASOUND', 'PRESCRIPTION', 'DISCHARGE_SUMMARY', 'XRAY', 'MRI', 'CT_SCAN', 'VACCINATION_CERTIFICATE', 'INSURANCE_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "MedicationFrequency" AS ENUM ('ONCE_DAILY', 'TWICE_DAILY', 'THRICE_DAILY', 'FOUR_TIMES_DAILY', 'WEEKLY', 'AS_NEEDED', 'BEFORE_MEALS', 'AFTER_MEALS');

-- CreateEnum
CREATE TYPE "MeetingProvider" AS ENUM ('AWS_CHIME', 'TWILIO', 'ZOOM', 'GOOGLE_MEET', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('PREGNANCY_JOURNEY', 'HEALTH_TIPS', 'NUTRITION', 'MENTAL_HEALTH', 'ASK_DOCTOR', 'PARENTING', 'CHILD_DEVELOPMENT', 'MENOPAUSE', 'FERTILITY', 'GENERAL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'REEL', 'CAROUSEL', 'TEXT_ONLY');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED_FOR_REVIEW');

-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('SPAM', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'HARASSMENT', 'NUDITY_VIOLENCE', 'MEDICAL_MISINFORMATION');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "AppointmentLogAction" AS ENUM ('CREATED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'REMINDER_SENT', 'VIDEO_CALL_STARTED', 'VIDEO_CALL_ENDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('RAZORPAY', 'UPI', 'CARD', 'CASH', 'PHONEPE', 'PAYTM', 'GPAY');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PROCESSING', 'PAID', 'FAILED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('DIRECT_MESSAGE', 'GROUP_CHAT', 'DOCTOR_PATIENT');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'VOICE_NOTE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PILL_REMINDER', 'OVULATION_ALERT', 'PERIOD_PREDICTION', 'APPOINTMENT_REMINDER', 'VACCINE_DUE', 'GROWTH_CHECKUP', 'WATER_REMINDER', 'EXERCISE_REMINDER', 'CYCLE_IRREGULARITY', 'PARTNER_ALERT', 'PAYMENT_RECEIVED', 'PAYOUT_PROCESSED', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('MENSTRUAL_HEALTH', 'FERTILITY', 'PREGNANCY', 'POSTPARTUM', 'CHILD_CARE', 'MENOPAUSE', 'NUTRITION', 'MENTAL_HEALTH', 'REPRODUCTIVE_DISORDERS');

-- CreateEnum
CREATE TYPE "ContentDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "EmergencyType" AS ENUM ('LABOR_STARTED', 'HEAVY_BLEEDING', 'SEVERE_PAIN', 'MEDICAL_EMERGENCY', 'SAFETY_CONCERN');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'SHARE', 'CONSENT_GRANTED', 'CONSENT_REVOKED', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'VITALS_RECORD', 'PREGNANCY_JOURNEY', 'APPOINTMENT', 'POST', 'DOCTOR_PROFILE', 'ABHA_CONSENT', 'MESSAGE', 'CHILD_PROFILE', 'VACCINATION_RECORD', 'GROWTH_RECORD', 'PRESCRIPTION', 'MEDICAL_DOCUMENT', 'PAYMENT');

-- CreateEnum
CREATE TYPE "FollowStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "enablePush" BOOLEAN NOT NULL DEFAULT true,
    "enableEmail" BOOLEAN NOT NULL DEFAULT false,
    "enableSMS" BOOLEAN NOT NULL DEFAULT false,
    "enableWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "preferredTime" TIME,
    "frequency" VARCHAR(50),
    "isSmartEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_read_logs" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentTitle" VARCHAR(500) NOT NULL,
    "contentCategory" "ContentCategory" NOT NULL,
    "difficulty" "ContentDifficulty" NOT NULL,
    "readDuration" INTEGER,
    "completedReading" BOOLEAN NOT NULL DEFAULT false,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "readDuringLifeStage" "LifeStage",

    CONSTRAINT "content_read_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "itemName" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "purchasedAt" DATE,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregnancy_journeys" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "lmpDate" DATE,
    "eddDate" DATE,
    "pregnancyConfirmedAt" TIMESTAMPTZ(3),
    "status" "PregnancyStatus" NOT NULL DEFAULT 'PREGNANT',
    "riskLevel" "PregnancyRiskLevel" NOT NULL DEFAULT 'LOW',
    "highRiskFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliveryDate" DATE,
    "deliveryMethod" "DeliveryMethod",
    "outcome" "DeliveryOutcome" NOT NULL DEFAULT 'ONGOING',
    "birthWeight" DECIMAL(5,2),
    "gestationalWeeks" INTEGER,
    "notes" TEXT,

    CONSTRAINT "pregnancy_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_participants" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "journeyId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canViewAll" BOOLEAN NOT NULL DEFAULT true,
    "invitedBy" TEXT NOT NULL,
    "invitedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ(3),

    CONSTRAINT "journey_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vitals_records" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,
    "source" "VitalsSource" NOT NULL DEFAULT 'MANUAL_ENTRY',
    "systolicBP" INTEGER,
    "diastolicBP" INTEGER,
    "heartRate" INTEGER,
    "weight" DECIMAL(5,2),
    "oxygenSaturation" DECIMAL(5,2),
    "glucoseLevel" DECIMAL(5,2),
    "fetalHeartRate" INTEGER,
    "fundalHeight" DECIMAL(4,1),
    "gestationalWeek" INTEGER,
    "symptomsReported" BOOLEAN NOT NULL DEFAULT false,
    "symptomDetails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "alertGenerated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vitals_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetal_movement_records" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "journeyId" TEXT NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "fetal_movement_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_cycles" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "cycleLength" INTEGER,
    "periodDuration" INTEGER,
    "flowIntensity" "PeriodFlowIntensity",
    "symptomsAndMood" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cervicalMucus" "CervicalMucus",
    "basalBodyTemperature" DECIMAL(4,2),
    "notes" TEXT,

    CONSTRAINT "period_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abdm_consents" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "consentHandle" VARCHAR(255) NOT NULL,
    "status" "AbdmConsentStatus" NOT NULL DEFAULT 'REQUESTED',
    "consentArtefactId" VARCHAR(255),
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedAt" TIMESTAMPTZ(3),
    "validFrom" TIMESTAMPTZ(3),
    "validUntil" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "purpose" TEXT NOT NULL,
    "dataTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hipId" VARCHAR(100),

    CONSTRAINT "abdm_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "timeOfBirth" TIME,
    "gender" "Gender" NOT NULL,
    "bloodGroup" VARCHAR(5),
    "abhaNumber" VARCHAR(20),
    "birthWeight" DECIMAL(5,2),
    "birthLength" DECIMAL(5,2),
    "headCircumference" DECIMAL(5,2),
    "apgarScore" INTEGER,
    "pregnancyJourneyId" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chronicConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_records" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "childId" TEXT NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,
    "height" DECIMAL(5,2),
    "weight" DECIMAL(5,2),
    "headCircumference" DECIMAL(5,2),
    "bmi" DECIMAL(4,1),
    "percentileHeight" INTEGER,
    "percentileWeight" INTEGER,
    "percentileBMI" INTEGER,
    "ageInMonths" INTEGER,
    "source" VARCHAR(100),
    "notes" TEXT,

    CONSTRAINT "growth_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccination_records" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "childId" TEXT NOT NULL,
    "vaccineName" VARCHAR(100) NOT NULL,
    "doseNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "VaccineStatus" NOT NULL DEFAULT 'UPCOMING',
    "scheduledDate" DATE NOT NULL,
    "administeredDate" DATE,
    "batchNumber" VARCHAR(50),
    "administeredBy" VARCHAR(255),
    "location" VARCHAR(255),
    "hasReaction" BOOLEAN NOT NULL DEFAULT false,
    "reactionDetails" TEXT,
    "reactionSeverity" VARCHAR(50),
    "notes" TEXT,

    CONSTRAINT "vaccination_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_records" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "childId" TEXT NOT NULL,
    "milestoneName" VARCHAR(255) NOT NULL,
    "category" "MilestoneCategory" NOT NULL,
    "achievedAt" DATE NOT NULL,
    "ageInMonths" DECIMAL(4,1),
    "isDelayed" BOOLEAN NOT NULL DEFAULT false,
    "isEarly" BOOLEAN NOT NULL DEFAULT false,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,

    CONSTRAINT "milestone_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reproductive_profiles" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "isIrregular" BOOLEAN NOT NULL DEFAULT false,
    "averageCycleLength" DECIMAL(4,1),
    "shortestCycle" INTEGER,
    "longestCycle" INTEGER,
    "diagnosedConditions" "ReproductiveCondition"[] DEFAULT ARRAY['NONE']::"ReproductiveCondition"[],
    "diagnosisDate" DATE,
    "treatingDoctorId" TEXT,
    "isOnBirthControl" BOOLEAN NOT NULL DEFAULT false,
    "birthControlType" VARCHAR(100),
    "isOnFertilityTreatment" BOOLEAN NOT NULL DEFAULT false,
    "smokingStatus" VARCHAR(50),
    "alcoholConsumption" VARCHAR(50),
    "stressLevel" VARCHAR(50),

    CONSTRAINT "reproductive_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_health_logs" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "logDate" DATE NOT NULL,
    "flowType" "FlowType",
    "cervicalMucus" "CervicalMucus",
    "painLevel" "PainLevel",
    "painLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "basalBodyTemp" DECIMAL(4,2),
    "mood" "MoodLevel",
    "energyLevel" INTEGER,
    "sleepQuality" INTEGER,
    "sleepHours" DECIMAL(3,1),
    "menopauseSymptoms" "MenopauseSymptom"[] DEFAULT ARRAY[]::"MenopauseSymptom"[],
    "hadIntercourse" BOOLEAN NOT NULL DEFAULT false,
    "usedProtection" BOOLEAN NOT NULL DEFAULT false,
    "waterIntake" INTEGER,
    "exerciseMinutes" INTEGER,
    "exerciseType" VARCHAR(100),
    "notes" TEXT,

    CONSTRAINT "daily_health_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_predictions" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "predictedStartDate" DATE NOT NULL,
    "predictedOvulationDate" DATE,
    "predictedEndDate" DATE,
    "actualStartDate" DATE,
    "actualOvulationDate" DATE,
    "actualEndDate" DATE,
    "confidenceLevel" INTEGER,
    "predictionMethod" VARCHAR(100) NOT NULL,
    "fertilityWindowStart" DATE,
    "fertilityWindowEnd" DATE,
    "startDateError" INTEGER,
    "ovulationDateError" INTEGER,

    CONSTRAINT "cycle_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "appointmentId" TEXT,
    "medicationName" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" "MedicationFrequency" NOT NULL,
    "duration" INTEGER,
    "instructions" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "prescribedDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATE,
    "endDate" DATE,
    "isDigitallySigned" BOOLEAN NOT NULL DEFAULT false,
    "signatureUrl" TEXT,
    "refillsAllowed" INTEGER DEFAULT 0,
    "refillsUsed" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_documents" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "MedicalDocumentType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "documentDate" DATE,
    "s3Url" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileSize" INTEGER,
    "mimeType" VARCHAR(100),
    "uploadedBy" TEXT NOT NULL,
    "uploadedByDoctor" TEXT,
    "isOCRProcessed" BOOLEAN NOT NULL DEFAULT false,
    "extractedData" JSONB,
    "sharedWithDoctors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_relationships" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "requesterId" TEXT NOT NULL,
    "accepterId" TEXT NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ(3),
    "declinedAt" TIMESTAMPTZ(3),
    "canViewFertilityData" BOOLEAN NOT NULL DEFAULT false,
    "canViewPregnancyData" BOOLEAN NOT NULL DEFAULT false,
    "canViewChildData" BOOLEAN NOT NULL DEFAULT false,
    "canViewPeriodDetails" BOOLEAN NOT NULL DEFAULT false,
    "canViewVitals" BOOLEAN NOT NULL DEFAULT false,
    "canBookAppointments" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveAlerts" BOOLEAN NOT NULL DEFAULT false,
    "canViewPrivateContent" BOOLEAN NOT NULL DEFAULT false,
    "guardianshipEndDate" DATE,

    CONSTRAINT "user_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "alertViaSMS" BOOLEAN NOT NULL DEFAULT true,
    "alertViaWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "alertViaCall" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "emergencyType" "EmergencyType" NOT NULL,
    "triggeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "alertsSent" INTEGER NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMPTZ(3),
    "notes" TEXT,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL DEFAULT 'GENERAL',
    "mediaType" "MediaType" NOT NULL DEFAULT 'TEXT_ONLY',
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "videoDuration" INTEGER,
    "isOfficialContent" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isAIModerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModerationResult" JSONB,
    "aiModerationDate" TIMESTAMPTZ(3),
    "contentEmbedding" vector(1536),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "askedById" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL DEFAULT 'ASK_DOCTOR',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "questionEmbedding" vector(1536),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "questionId" TEXT NOT NULL,
    "answeredById" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDoctorVerifiedAnswer" BOOLEAN NOT NULL DEFAULT false,
    "isAcceptedAnswer" BOOLEAN NOT NULL DEFAULT false,
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "chatType" "ChatType" NOT NULL DEFAULT 'DIRECT_MESSAGE',
    "title" VARCHAR(255),
    "lastMessageAt" TIMESTAMPTZ(3),

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMPTZ(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "attachmentUrl" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMPTZ(3),
    "readAt" TIMESTAMPTZ(3),
    "replyToMessageId" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "clinicId" TEXT,
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "consultationType" "ConsultationType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reasonForVisit" TEXT,
    "patientNotes" TEXT,
    "doctorNotes" TEXT,
    "videoCallUrl" TEXT,
    "meetingProvider" "MeetingProvider" DEFAULT 'AWS_CHIME',
    "meetingId" VARCHAR(100),
    "recordingUrl" TEXT,
    "consultationFee" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "transactionId" VARCHAR(255),
    "reminderSentAt" TIMESTAMPTZ(3),

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_logs" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appointmentId" TEXT NOT NULL,
    "action" "AppointmentLogAction" NOT NULL,
    "performedBy" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "gateway" VARCHAR(50) NOT NULL,
    "gatewayOrderId" VARCHAR(255) NOT NULL,
    "gatewayPaymentId" VARCHAR(255),
    "status" "PaymentStatus" NOT NULL,
    "failureReason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_payouts" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "doctorId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PROCESSING',
    "transactionRef" VARCHAR(255),
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "bankAccountLast4" VARCHAR(4),
    "processedAt" TIMESTAMPTZ(3),
    "failureReason" TEXT,
    "notes" TEXT,

    CONSTRAINT "doctor_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flags" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "postId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reason" "FlagReason" NOT NULL DEFAULT 'SPAM',
    "description" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewedBy" TEXT,

    CONSTRAINT "moderation_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "sessionId" TEXT,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "isPrivateAccount" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "username" TEXT,
    "profilePictureUrl" TEXT,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "email" VARCHAR(255),
    "passwordHash" VARCHAR(255),
    "phoneNumber" VARCHAR(15),
    "countryCode" "CountryCode" DEFAULT 'IN',
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "googleId" VARCHAR(255),
    "abhaAddress" VARCHAR(50),
    "abhaId" VARCHAR(14),
    "points" INTEGER NOT NULL DEFAULT 0,
    "dailyLoginStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStreakUpdateDate" DATE,
    "lastLoginAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "status" "FollowStatus" NOT NULL DEFAULT 'ACCEPTED',
    "acceptedAt" TIMESTAMPTZ(3),

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" VARCHAR(255) NOT NULL,
    "deviceName" VARCHAR(255) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMPTZ(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "countryCode" "CountryCode" NOT NULL DEFAULT 'IN',
    "otpCode" VARCHAR(6) NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'LOGIN',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3),
    "resentCount" INTEGER NOT NULL DEFAULT 0,
    "lastResentAt" TIMESTAMPTZ(3),

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredLanguage" "PreferredLanguage" NOT NULL DEFAULT 'ENGLISH',
    "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
    "lifeStage" "LifeStage",
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "vitalsReminders" BOOLEAN NOT NULL DEFAULT true,
    "weeklyPregnancyUpdates" BOOLEAN NOT NULL DEFAULT true,
    "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
    "vaccinationReminders" BOOLEAN NOT NULL DEFAULT true,
    "milestoneNotifications" BOOLEAN NOT NULL DEFAULT true,
    "guardianModeEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "details" JSONB,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "phone" VARCHAR(15),
    "logoUrl" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "registrationNumber" VARCHAR(50) NOT NULL,
    "councilName" "MedicalCouncil" NOT NULL,
    "licenseExpiryDate" DATE,
    "specialization" "DoctorSpecialization" NOT NULL,
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceYears" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ(3),
    "verifiedBy" TEXT,
    "bio" TEXT,
    "websiteUrl" TEXT,
    "instagramHandle" VARCHAR(100),
    "youtubeChannel" TEXT,
    "linkedinProfile" TEXT,
    "totalConsultations" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_clinic_registries" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "consultationFee" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "consultationTypes" "ConsultationType"[],
    "roleInClinic" VARCHAR(100),
    "isPrimaryClinic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "doctor_clinic_registries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability" (
    "id" VARCHAR(21) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 15,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATE,
    "effectiveTo" DATE,

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_notificationType_key" ON "notification_preferences"("userId", "notificationType");

-- CreateIndex
CREATE INDEX "content_read_logs_userId_idx" ON "content_read_logs"("userId");

-- CreateIndex
CREATE INDEX "content_read_logs_contentCategory_idx" ON "content_read_logs"("contentCategory");

-- CreateIndex
CREATE INDEX "shopping_list_items_userId_idx" ON "shopping_list_items"("userId");

-- CreateIndex
CREATE INDEX "shopping_list_items_isPurchased_idx" ON "shopping_list_items"("isPurchased");

-- CreateIndex
CREATE INDEX "pregnancy_journeys_userId_idx" ON "pregnancy_journeys"("userId");

-- CreateIndex
CREATE INDEX "pregnancy_journeys_eddDate_idx" ON "pregnancy_journeys"("eddDate");

-- CreateIndex
CREATE INDEX "pregnancy_journeys_status_idx" ON "pregnancy_journeys"("status");

-- CreateIndex
CREATE INDEX "journey_participants_journeyId_idx" ON "journey_participants"("journeyId");

-- CreateIndex
CREATE INDEX "journey_participants_participantId_idx" ON "journey_participants"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "journey_participants_journeyId_participantId_key" ON "journey_participants"("journeyId", "participantId");

-- CreateIndex
CREATE INDEX "vitals_records_userId_recordedAt_idx" ON "vitals_records"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "vitals_records_recordedAt_idx" ON "vitals_records"("recordedAt");

-- CreateIndex
CREATE INDEX "fetal_movement_records_journeyId_recordedAt_idx" ON "fetal_movement_records"("journeyId", "recordedAt");

-- CreateIndex
CREATE INDEX "period_cycles_userId_startDate_idx" ON "period_cycles"("userId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "abdm_consents_consentHandle_key" ON "abdm_consents"("consentHandle");

-- CreateIndex
CREATE INDEX "abdm_consents_userId_idx" ON "abdm_consents"("userId");

-- CreateIndex
CREATE INDEX "abdm_consents_consentHandle_idx" ON "abdm_consents"("consentHandle");

-- CreateIndex
CREATE INDEX "abdm_consents_status_idx" ON "abdm_consents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "child_profiles_abhaNumber_key" ON "child_profiles"("abhaNumber");

-- CreateIndex
CREATE INDEX "child_profiles_parentId_idx" ON "child_profiles"("parentId");

-- CreateIndex
CREATE INDEX "child_profiles_dateOfBirth_idx" ON "child_profiles"("dateOfBirth");

-- CreateIndex
CREATE INDEX "child_profiles_pregnancyJourneyId_idx" ON "child_profiles"("pregnancyJourneyId");

-- CreateIndex
CREATE INDEX "growth_records_childId_recordedAt_idx" ON "growth_records"("childId", "recordedAt");

-- CreateIndex
CREATE INDEX "growth_records_recordedAt_idx" ON "growth_records"("recordedAt");

-- CreateIndex
CREATE INDEX "vaccination_records_childId_scheduledDate_idx" ON "vaccination_records"("childId", "scheduledDate");

-- CreateIndex
CREATE INDEX "vaccination_records_status_idx" ON "vaccination_records"("status");

-- CreateIndex
CREATE INDEX "vaccination_records_vaccineName_idx" ON "vaccination_records"("vaccineName");

-- CreateIndex
CREATE INDEX "milestone_records_childId_achievedAt_idx" ON "milestone_records"("childId", "achievedAt");

-- CreateIndex
CREATE INDEX "milestone_records_category_idx" ON "milestone_records"("category");

-- CreateIndex
CREATE INDEX "milestone_records_isDelayed_idx" ON "milestone_records"("isDelayed");

-- CreateIndex
CREATE UNIQUE INDEX "reproductive_profiles_userId_key" ON "reproductive_profiles"("userId");

-- CreateIndex
CREATE INDEX "reproductive_profiles_userId_idx" ON "reproductive_profiles"("userId");

-- CreateIndex
CREATE INDEX "daily_health_logs_userId_logDate_idx" ON "daily_health_logs"("userId", "logDate");

-- CreateIndex
CREATE INDEX "daily_health_logs_logDate_idx" ON "daily_health_logs"("logDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_health_logs_userId_logDate_key" ON "daily_health_logs"("userId", "logDate");

-- CreateIndex
CREATE INDEX "cycle_predictions_userId_predictedStartDate_idx" ON "cycle_predictions"("userId", "predictedStartDate");

-- CreateIndex
CREATE INDEX "cycle_predictions_predictedStartDate_idx" ON "cycle_predictions"("predictedStartDate");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_idx" ON "prescriptions"("patientId");

-- CreateIndex
CREATE INDEX "prescriptions_doctorId_idx" ON "prescriptions"("doctorId");

-- CreateIndex
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

-- CreateIndex
CREATE INDEX "medical_documents_userId_idx" ON "medical_documents"("userId");

-- CreateIndex
CREATE INDEX "medical_documents_documentType_idx" ON "medical_documents"("documentType");

-- CreateIndex
CREATE INDEX "medical_documents_documentDate_idx" ON "medical_documents"("documentDate");

-- CreateIndex
CREATE INDEX "user_relationships_requesterId_idx" ON "user_relationships"("requesterId");

-- CreateIndex
CREATE INDEX "user_relationships_accepterId_idx" ON "user_relationships"("accepterId");

-- CreateIndex
CREATE INDEX "user_relationships_relationType_idx" ON "user_relationships"("relationType");

-- CreateIndex
CREATE UNIQUE INDEX "user_relationships_requesterId_accepterId_key" ON "user_relationships"("requesterId", "accepterId");

-- CreateIndex
CREATE INDEX "emergency_contacts_userId_idx" ON "emergency_contacts"("userId");

-- CreateIndex
CREATE INDEX "emergency_contacts_priority_idx" ON "emergency_contacts"("priority");

-- CreateIndex
CREATE INDEX "emergency_alerts_userId_idx" ON "emergency_alerts"("userId");

-- CreateIndex
CREATE INDEX "emergency_alerts_triggeredAt_idx" ON "emergency_alerts"("triggeredAt");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_category_idx" ON "posts"("category");

-- CreateIndex
CREATE INDEX "posts_mediaType_idx" ON "posts"("mediaType");

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "posts"("createdAt");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "posts"("status");

-- CreateIndex
CREATE INDEX "posts_viewCount_idx" ON "posts"("viewCount");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");

-- CreateIndex
CREATE INDEX "likes_postId_idx" ON "likes"("postId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_postId_userId_key" ON "likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "questions_askedById_idx" ON "questions"("askedById");

-- CreateIndex
CREATE INDEX "questions_createdAt_idx" ON "questions"("createdAt");

-- CreateIndex
CREATE INDEX "answers_questionId_idx" ON "answers"("questionId");

-- CreateIndex
CREATE INDEX "answers_answeredById_idx" ON "answers"("answeredById");

-- CreateIndex
CREATE INDEX "answers_isDoctorVerifiedAnswer_idx" ON "answers"("isDoctorVerifiedAnswer");

-- CreateIndex
CREATE INDEX "chats_chatType_idx" ON "chats"("chatType");

-- CreateIndex
CREATE INDEX "chats_lastMessageAt_idx" ON "chats"("lastMessageAt");

-- CreateIndex
CREATE INDEX "chat_participants_chatId_idx" ON "chat_participants"("chatId");

-- CreateIndex
CREATE INDEX "chat_participants_userId_idx" ON "chat_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participants_chatId_userId_key" ON "chat_participants"("chatId", "userId");

-- CreateIndex
CREATE INDEX "messages_chatId_createdAt_idx" ON "messages"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_transactionId_key" ON "appointments"("transactionId");

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");

-- CreateIndex
CREATE INDEX "appointments_doctorId_idx" ON "appointments"("doctorId");

-- CreateIndex
CREATE INDEX "appointments_clinicId_idx" ON "appointments"("clinicId");

-- CreateIndex
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_paymentStatus_idx" ON "appointments"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_doctorId_scheduledAt_key" ON "appointments"("doctorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointment_logs_appointmentId_idx" ON "appointment_logs"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_logs_timestamp_idx" ON "appointment_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_gatewayPaymentId_key" ON "payment_transactions"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "payment_transactions_appointmentId_idx" ON "payment_transactions"("appointmentId");

-- CreateIndex
CREATE INDEX "payment_transactions_gatewayOrderId_idx" ON "payment_transactions"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");

-- CreateIndex
CREATE INDEX "doctor_payouts_doctorId_idx" ON "doctor_payouts"("doctorId");

-- CreateIndex
CREATE INDEX "doctor_payouts_status_idx" ON "doctor_payouts"("status");

-- CreateIndex
CREATE INDEX "doctor_payouts_periodStart_idx" ON "doctor_payouts"("periodStart");

-- CreateIndex
CREATE INDEX "moderation_flags_postId_idx" ON "moderation_flags"("postId");

-- CreateIndex
CREATE INDEX "moderation_flags_reportedById_idx" ON "moderation_flags"("reportedById");

-- CreateIndex
CREATE INDEX "moderation_flags_status_idx" ON "moderation_flags"("status");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_abhaAddress_key" ON "users"("abhaAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_abhaId_key" ON "users"("abhaId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phoneNumber_idx" ON "users"("phoneNumber");

-- CreateIndex
CREATE INDEX "users_abhaAddress_idx" ON "users"("abhaAddress");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_gender_idx" ON "users"("gender");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_countryCode_phoneNumber_key" ON "users"("countryCode", "phoneNumber");

-- CreateIndex
CREATE INDEX "user_follows_followerId_idx" ON "user_follows"("followerId");

-- CreateIndex
CREATE INDEX "user_follows_followingId_idx" ON "user_follows"("followingId");

-- CreateIndex
CREATE INDEX "user_follows_status_idx" ON "user_follows"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_followerId_followingId_key" ON "user_follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_deviceId_idx" ON "refresh_tokens"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "otp_verifications_phoneNumber_countryCode_purpose_idx" ON "otp_verifications"("phoneNumber", "countryCode", "purpose");

-- CreateIndex
CREATE INDEX "otp_verifications_expiresAt_idx" ON "otp_verifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "user_settings_userId_idx" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "user_activity_logs_userId_activityType_idx" ON "user_activity_logs"("userId", "activityType");

-- CreateIndex
CREATE INDEX "user_activity_logs_createdAt_idx" ON "user_activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "clinics_city_idx" ON "clinics"("city");

-- CreateIndex
CREATE INDEX "clinics_name_idx" ON "clinics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_userId_key" ON "doctor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_registrationNumber_key" ON "doctor_profiles"("registrationNumber");

-- CreateIndex
CREATE INDEX "doctor_profiles_registrationNumber_idx" ON "doctor_profiles"("registrationNumber");

-- CreateIndex
CREATE INDEX "doctor_profiles_isVerified_idx" ON "doctor_profiles"("isVerified");

-- CreateIndex
CREATE INDEX "doctor_profiles_specialization_idx" ON "doctor_profiles"("specialization");

-- CreateIndex
CREATE INDEX "doctor_clinic_registries_doctorId_idx" ON "doctor_clinic_registries"("doctorId");

-- CreateIndex
CREATE INDEX "doctor_clinic_registries_clinicId_idx" ON "doctor_clinic_registries"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_clinic_registries_doctorId_clinicId_key" ON "doctor_clinic_registries"("doctorId", "clinicId");

-- CreateIndex
CREATE INDEX "doctor_availability_doctorId_dayOfWeek_idx" ON "doctor_availability"("doctorId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "doctor_availability_clinicId_idx" ON "doctor_availability"("clinicId");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_read_logs" ADD CONSTRAINT "content_read_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy_journeys" ADD CONSTRAINT "pregnancy_journeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_participants" ADD CONSTRAINT "journey_participants_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "pregnancy_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_participants" ADD CONSTRAINT "journey_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals_records" ADD CONSTRAINT "vitals_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetal_movement_records" ADD CONSTRAINT "fetal_movement_records_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "pregnancy_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_cycles" ADD CONSTRAINT "period_cycles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abdm_consents" ADD CONSTRAINT "abdm_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_pregnancyJourneyId_fkey" FOREIGN KEY ("pregnancyJourneyId") REFERENCES "pregnancy_journeys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_records" ADD CONSTRAINT "growth_records_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_records" ADD CONSTRAINT "milestone_records_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reproductive_profiles" ADD CONSTRAINT "reproductive_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_health_logs" ADD CONSTRAINT "daily_health_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_predictions" ADD CONSTRAINT "cycle_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_uploadedByDoctor_fkey" FOREIGN KEY ("uploadedByDoctor") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_accepterId_fkey" FOREIGN KEY ("accepterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_logs" ADD CONSTRAINT "appointment_logs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_payouts" ADD CONSTRAINT "doctor_payouts_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_clinic_registries" ADD CONSTRAINT "doctor_clinic_registries_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_clinic_registries" ADD CONSTRAINT "doctor_clinic_registries_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- For Posts (HNSW index is best for performance/recall balance)
CREATE INDEX "posts_embedding_idx" ON "posts" USING hnsw ("contentEmbedding" vector_cosine_ops);

-- For Questions
CREATE INDEX "questions_embedding_idx" ON "questions" USING hnsw ("questionEmbedding" vector_cosine_ops);
