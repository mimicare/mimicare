Write-Host "Exporting Mimicare Prisma Schema..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$RootPath = (Get-Location).Path
$RootPath = (Resolve-Path $RootPath).Path
if ($RootPath.EndsWith('\') -or $RootPath.EndsWith('/')) {
    $RootPath = $RootPath.Substring(0, $RootPath.Length - 1)
}

$outputDir = Join-Path $RootPath "data\context"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$outputDir\schema_$timestamp.md"

# Create output directory
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# Prisma paths
$schemaBasePath = Join-Path $RootPath "packages\database\prisma"
$schemaFile = Join-Path $schemaBasePath "schema.prisma"
$modelsPath = Join-Path $schemaBasePath "models"
$migrationsPath = Join-Path $schemaBasePath "migrations"

Write-Host "Schema Base Path: $schemaBasePath" -ForegroundColor Cyan
Write-Host "Output: $outputFile" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Initialize file with comprehensive header
$headerContent = @"
# Mimicare Database Schema - Complete Export

**Project:** Mimicare - Whole-Woman Lifecycle & Family Health Platform
**Database:** PostgreSQL 16+ with pgvector extension
**ORM:** Prisma 7.1.0
**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') IST
**Architecture:** Enterprise-Grade, AWS-Optimized

---

## Schema Architecture Overview

This is a **production-ready, enterprise-grade database schema** for the Indian healthcare market with:

### Core Features
- **Lifecycle Coverage**: Puberty (11y) to Reproductive to Menopause (50+)
- **Multi-User Types**: Patients, Doctors, Guardians, Partners
- **ABDM Compliance**: ABHA integration with FHIR annotations
- **Payment Reconciliation**: Razorpay/UPI transaction tracking
- **AWS Optimization**: DynamoDB offload strategies for high-volume data

### Critical Design Decisions
1. **Twins/Multiples Support**: One-to-many PregnancyJourney to ChildProfile
2. **Doctor Scheduling**: Multi-clinic availability with slot management
3. **PCOS-Aware Fertility**: Specialized cycle prediction algorithms
4. **Content Moderation**: Instagram-style reels with AI moderation hooks
5. **pgvector Ready**: Semantic search and RAG for AI chatbot

### AWS Offloading Strategy
- **PostgreSQL (RDS Aurora)**: Core relational data (Users, Health Records, Appointments)
- **DynamoDB**: High-volume logs (UserActivityLog, Message, AuditLog)
- **S3**: Media storage (photos, videos, medical documents)
- **Rekognition**: Automated content moderation
- **Bedrock**: AI chatbot with medical knowledge base

---

"@

$headerContent | Out-File -FilePath $outputFile -Encoding UTF8

# Helper function to add a schema file
function Add-SchemaFile {
    param(
        [string]$FilePath,
        [string]$SectionTitle,
        [string]$Description = ""
    )

    if (-not (Test-Path $FilePath)) {
        Write-Host "  Warning: Not found: $FilePath" -ForegroundColor Yellow
        return 0
    }

    $file = Get-Item $FilePath
    $relativePath = $file.FullName
    if ($relativePath.StartsWith($RootPath)) {
        $relativePath = $relativePath.Substring($RootPath.Length + 1)
    }

    "## $SectionTitle" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

    if ($Description) {
        $Description | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }

    "**File:** ``$relativePath``" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "**Size:** $([math]::Round($file.Length / 1KB, 2)) KB" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "``````prisma" | Out-File -FilePath $outputFile -Append -Encoding UTF8

    try {
        Get-Content $file.FullName -Raw | Out-File -FilePath $outputFile -Append -Encoding UTF8
    } catch {
        "// Error reading file" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }

    "``````" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "---" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

    Write-Host "  Exported: $relativePath" -ForegroundColor Green
    return 1
}

$totalFiles = 0

# 1. Main Schema File
Write-Host "`nExporting Main Schema..." -ForegroundColor Yellow
$mainDescription = "This is the root Prisma schema file that configures:`n- Database connection (PostgreSQL)`n- Prisma Client generator`n- pgvector extension setup (commented for future use)"
$totalFiles += Add-SchemaFile -FilePath $schemaFile -SectionTitle "Main Schema Configuration" -Description $mainDescription

# 2. Model Files
if (Test-Path $modelsPath) {
    Write-Host "`nExporting Model Files..." -ForegroundColor Yellow

    # Define model files in logical order with descriptions
    $modelFiles = @(
        @{
            Name = "enums.prisma"
            Title = "Enums - Type Definitions"
            Description = "Comprehensive enum definitions covering:`n- User roles and authentication`n- Medical specializations and councils`n- Health data types (reproductive, pregnancy, pediatric)`n- Payment statuses and methods`n- Content moderation and media types`n- Lifecycle stages and relationship types"
        },
        @{
            Name = "user.prisma"
            Title = "User Models - Authentication and Profiles"
            Description = "Core user management including:`n- Multi-method authentication (WhatsApp OTP, Google, Email)`n- ABHA/ABDM integration for Indian healthcare`n- Doctor profiles with verification workflow`n- Clinic management`n- Doctor availability slots (Fix 2: Multi-clinic scheduling)`n- Gamification (points, streaks)"
        },
        @{
            Name = "health-reproductive.prisma"
            Title = "Reproductive Health - Fertility and Cycle Tracking"
            Description = "Advanced fertility tracking with:`n- Reproductive profiles (PCOS, endometriosis support)`n- Daily health logs (BBT, cervical mucus, symptoms)`n- Cycle predictions with ML accuracy tracking`n- Menopause symptom tracking`n- Symptothermal method support"
        },
        @{
            Name = "health-maternity.prisma"
            Title = "Maternity Health - Pregnancy and Postpartum"
            Description = "Pregnancy journey management:`n- Pregnancy tracking (LMP, EDD, risk levels)`n- Journey participants (partners, doctors, family)`n- Vitals records (maternal and fetal)`n- Fetal movement tracking (kick counting)`n- Period cycle tracking`n- ABDM consent management`n- Fix 1: Twins/Multiples support (one-to-many relationship)"
        },
        @{
            Name = "health-pediatric.prisma"
            Title = "Pediatric Health - Child Care (0-18 years)"
            Description = "18-year child health tracking:`n- Child profiles with birth details`n- Growth records (WHO/CDC percentiles)`n- Vaccination schedules (Indian UIP/IAP)`n- Developmental milestones`n- Links back to pregnancy journey (retention strategy)"
        },
        @{
            Name = "relationships.prisma"
            Title = "Relationships - Family Unit and Emergency"
            Description = "Family-centric features:`n- User relationships (partner, guardian, caregiver)`n- Granular permission system`n- Guardian mode for teen users (privacy)`n- Emergency contacts with multi-channel alerts`n- Emergency alert system with GPS"
        },
        @{
            Name = "health-telemedicine.prisma"
            Title = "Telemedicine - Prescriptions and Documents"
            Description = "Healthcare delivery:`n- Digital prescriptions (ABDM-compliant signatures)`n- Medical document storage (lab reports, ultrasounds)`n- OCR extraction for auto-fill`n- Doctor-patient document sharing"
        },
        @{
            Name = "engagement.prisma"
            Title = "Engagement - Notifications and Learning"
            Description = "User retention features:`n- Granular notification preferences`n- Content read tracking with gamification`n- Shopping list (baby prep)`n- DynamoDB offload candidate: NotificationPreference"
        },
        @{
            Name = "social.prisma"
            Title = "Social and Telemedicine - Community, Appointments, Payments"
            Description = "Community and healthcare delivery:`n- Instagram-style posts with reels support (mediaType, thumbnailUrl, videoDuration)`n- AI moderation (AWS Rekognition integration)`n- pgvector ready for semantic search`n- Video appointments (AWS Chime/Twilio/Zoom)`n- Fix 3: Payment reconciliation (PaymentTransaction model)`n- Doctor payouts (weekly settlements)`n- Chat and messaging (DynamoDB offload candidate)`n- Audit logs (DynamoDB offload candidate)"
        }
    )

    foreach ($modelDef in $modelFiles) {
        $modelPath = Join-Path $modelsPath $modelDef.Name
        $totalFiles += Add-SchemaFile -FilePath $modelPath -SectionTitle $modelDef.Title -Description $modelDef.Description
    }
}

# 3. Migrations (optional - include latest migration)
if (Test-Path $migrationsPath) {
    Write-Host "`nChecking Migrations..." -ForegroundColor Yellow
    $migrationFolders = Get-ChildItem -Path $migrationsPath -Directory | Sort-Object Name -Descending

    if ($migrationFolders.Count -gt 0) {
        "## Recent Migrations" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "**Total Migrations:** $($migrationFolders.Count)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

        # List all migrations
        "### Migration History" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        foreach ($migration in $migrationFolders) {
            "- ``$($migration.Name)``" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        }
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

        # Include the latest migration SQL
        $latestMigration = $migrationFolders[0]
        $migrationSqlPath = Join-Path $latestMigration.FullName "migration.sql"

        if (Test-Path $migrationSqlPath) {
            "### Latest Migration SQL" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "**Migration:** ``$($latestMigration.Name)``" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "``````sql" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            Get-Content $migrationSqlPath -Raw | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "``````" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            Write-Host "  Latest migration: $($latestMigration.Name)" -ForegroundColor Green
            $totalFiles++
        }

        "---" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }
}

# Summary Statistics
$fileSize = (Get-Item $outputFile).Length

"## Schema Statistics" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

# Count models, enums, etc. by reading the files
$totalModels = 0
$totalEnums = 0
$totalRelations = 0

if (Test-Path $modelsPath) {
    $allPrismaFiles = Get-ChildItem -Path $modelsPath -Filter "*.prisma"
    foreach ($file in $allPrismaFiles) {
        $content = Get-Content $file.FullName -Raw
        $totalModels += ([regex]::Matches($content, "model\s+\w+")).Count
        $totalEnums += ([regex]::Matches($content, "enum\s+\w+")).Count
        $totalRelations += ([regex]::Matches($content, "@relation")).Count
    }
}

"| Metric | Count |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"|--------|-------|" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Schema Files | $totalFiles |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Models | $totalModels |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Enums | $totalEnums |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Relations | $totalRelations |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Export Size | $([math]::Round($fileSize / 1KB, 2)) KB |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Generated | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') IST |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

# Key Models Breakdown
$modelBreakdown = @"
### Key Models by Category

#### User and Authentication
- User, UserSetting, UserActivityLog
- DoctorProfile, Clinic, DoctorAvailability
- UserRelationship, EmergencyContact

#### Reproductive Health
- ReproductiveProfile, DailyHealthLog, CyclePrediction
- PeriodCycle

#### Maternity
- PregnancyJourney, JourneyParticipant
- VitalsRecord, FetalMovementRecord
- AbdmConsent

#### Pediatrics
- ChildProfile, GrowthRecord
- VaccinationRecord, MilestoneRecord

#### Telemedicine
- Appointment, Prescription
- MedicalDocument, PaymentTransaction, DoctorPayout

#### Social and Community
- Post, Comment, Like, Question, Answer
- Chat, Message, ModerationFlag

#### Engagement
- NotificationPreference, ContentReadLog
- ShoppingListItem, AuditLog

"@

$modelBreakdown | Out-File -FilePath $outputFile -Append -Encoding UTF8

# Production Readiness Notes
$productionNotes = @"
## Production Readiness Notes

### Implemented Features
1. **Twins/Multiples Support** - One-to-many PregnancyJourney to ChildProfile
2. **Doctor Scheduling** - DoctorAvailability with multi-clinic slots
3. **Payment Reconciliation** - PaymentTransaction for Razorpay/UPI flows
4. **Instagram Reels** - Rich media support in Post model
5. **Doctor Payouts** - DoctorPayout for financial settlements
6. **ABDM Compliance** - FHIR annotations throughout

### AWS Optimization Strategy
- **PostgreSQL (RDS Aurora)**: Core relational data
- **DynamoDB Candidates** (with TODO comments in schema):
  - UserActivityLog (WORN pattern)
  - Message (high-volume chat)
  - AuditLog (compliance, TTL=365 days)
  - NotificationPreference (low-read state)
- **S3**: Media storage (all URL fields)
- **Rekognition**: Content moderation (Post.aiModerationResult)
- **MediaConvert**: Video processing for reels
- **Bedrock**: AI chatbot with pgvector RAG

### Future Enhancements (Commented in Schema)
- Post.contentEmbedding - pgvector for semantic search
- Question.questionEmbedding - AI-powered Q&A matching
- Enable extensions = [vector] in main schema

"@

$productionNotes | Out-File -FilePath $outputFile -Append -Encoding UTF8

