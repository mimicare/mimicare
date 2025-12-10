Write-Host "Exporting Mimicare Codebase (Source Only)..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$outputDir = "data\context"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$outputDir\mimicare_$timestamp.md"

# Create output directory
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# Root-level config files
$rootFiles = @(
    "package.json",
    "turbo.json",
    "tsconfig.json",
    ".prettierrc",
    ".prettierignore",
    ".editorconfig",
    ".gitignore",
    ".env.example",
    "README.md"
)

# Backend config files
$backendFiles = @(
    "apps\backend\package.json",
    "apps\backend\tsconfig.json",
    "apps\backend\tsconfig.build.json",
    "apps\backend\nest-cli.json",
    "apps\backend\.env.example"
)

# Frontend config files (Flutter - if you have web admin)
$frontendFiles = @(
    "apps\frontend\package.json",
    "apps\frontend\tsconfig.json",
    "apps\frontend\vite.config.ts",
    "apps\frontend\tailwind.config.ts"
)

# Docker files
$dockerFiles = @(
    "docker-compose.yml",
    "docker\Dockerfile.backend",
    "docker\Dockerfile.frontend"
)

# Language mapping
function Get-SyntaxLanguage {
    param([string]$Extension)
    switch ($Extension) {
        { $_ -in @('ts', 'tsx') } { 'typescript' }
        { $_ -in @('js', 'jsx') } { 'javascript' }
        'json' { 'json' }
        { $_ -in @('yaml', 'yml') } { 'yaml' }
        { $_ -in @('css', 'scss') } { 'css' }
        'html' { 'html' }
        'md' { 'markdown' }
        'prisma' { 'prisma' }
        'sql' { 'sql' }
        'ps1' { 'powershell' }
        'dart' { 'dart' }
        default { 'text' }
    }
}

# Initialize file
@"
# Mimicare: Whole-Woman Lifecycle & Family Health Platform - Complete Codebase

**Project:** Maternal & Child Health Platform for India
**Tech Stack:** Flutter + NestJS + PostgreSQL + AWS
**Architecture:** Monorepo (Turborepo) with WhatsApp OTP Login
**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') IST
**Version:** 1.0.0 (MVP)

---

## Project Overview

Mimicare is a comprehensive maternal and child health platform designed for the Indian market,
supporting the entire lifecycle from Ovulation → Pregnancy → Postpartum → Child Care (0-18 years).

### Key Features
- **Advanced Menstrual & Fertility Tracking** (PCOS-aware predictions)
- **Pregnancy Journeys** (with Partner Dashboard & Doctor Collaboration)
- **Telemedicine** (Video consultations with verified OB-GYNs)
- **Pediatric Care** (Growth tracking, vaccination schedules, milestones)
- **ABDM Integration** (ABHA compliance for Indian healthcare)
- **Multi-Lifecycle Support** (Puberty → Menopause)

---

"@ | Out-File -FilePath $outputFile -Encoding UTF8

# Helper function to add files
function Add-FilesToContext {
    param(
        [string]$SectionTitle,
        [array]$Files
    )

    if ($Files.Count -eq 0) { return }

    Write-Host "`n$SectionTitle" -ForegroundColor Yellow
    "## $SectionTitle" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

    foreach ($file in ($Files | Sort-Object FullName)) {
        $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
        $ext = $file.Extension.TrimStart('.')
        $lang = Get-SyntaxLanguage -Extension $ext

        "### ``$relativePath``" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "``````$lang" | Out-File -FilePath $outputFile -Append -Encoding UTF8

        try {
            if ($file.Length -gt 500KB) {
                "// Large file - showing first 200 lines" | Out-File -FilePath $outputFile -Append -Encoding UTF8
                Get-Content $file.FullName -First 200 | Out-File -FilePath $outputFile -Append -Encoding UTF8
                "// ..." | Out-File -FilePath $outputFile -Append -Encoding UTF8
            } else {
                Get-Content $file.FullName -Raw | Out-File -FilePath $outputFile -Append -Encoding UTF8
            }
        } catch {
            "// Error reading file" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        }

        "``````" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

        Write-Host "  + $relativePath" -ForegroundColor DarkGray
    }

    "---" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

    Write-Host "  Exported $($Files.Count) files" -ForegroundColor Green
}

$totalFiles = 0

# 1. Backend Source (NestJS)
if (Test-Path "apps\backend\src") {
    Write-Host "`nScanning Backend..." -ForegroundColor Cyan
    $backendFiles = Get-ChildItem -Path "apps\backend\src" -Include *.ts,*.js -Recurse -File
    Add-FilesToContext -SectionTitle "Backend Source Code (NestJS)" -Files $backendFiles
    $totalFiles += $backendFiles.Count
}

# 2. Frontend Source (Admin Dashboard - if exists)
if (Test-Path "apps\frontend\src") {
    Write-Host "`nScanning Frontend Admin..." -ForegroundColor Cyan
    $frontendCodeFiles = Get-ChildItem -Path "apps\frontend\src" -Include *.ts,*.tsx,*.jsx,*.js -Recurse -File
    $frontendStyleFiles = Get-ChildItem -Path "apps\frontend\src" -Include *.css,*.scss -Recurse -File
    Add-FilesToContext -SectionTitle "Frontend Admin Code (React/Vite)" -Files $frontendCodeFiles
    Add-FilesToContext -SectionTitle "Frontend Styles" -Files $frontendStyleFiles
    $totalFiles += ($frontendCodeFiles.Count + $frontendStyleFiles.Count)
}

# 3. Flutter Mobile App (if exists)
if (Test-Path "apps\mobile") {
    Write-Host "`nScanning Flutter Mobile App..." -ForegroundColor Cyan
    $flutterFiles = Get-ChildItem -Path "apps\mobile\lib" -Include *.dart -Recurse -File
    Add-FilesToContext -SectionTitle "Flutter Mobile App" -Files $flutterFiles
    $totalFiles += $flutterFiles.Count
}

# 4. Packages - Database (Prisma Schema) - ONLY .prisma files, NO generated client
if (Test-Path "packages\database\prisma") {
    Write-Host "`nScanning Database Package..." -ForegroundColor Cyan

    # Get only .prisma files from models directory and main schema
    $schemaFiles = Get-ChildItem -Path "packages\database\prisma" -Include *.prisma -Recurse -File

    # Get migrations
    if (Test-Path "packages\database\prisma\migrations") {
        $migrationFiles = Get-ChildItem -Path "packages\database\prisma\migrations" -Include *.sql -Recurse -File
        $schemaFiles += $migrationFiles
    }

    # Add package-level files
    if (Test-Path "packages\database\package.json") {
        $schemaFiles += Get-Item "packages\database\package.json"
    }

    Add-FilesToContext -SectionTitle "Database - Prisma Schema (Enterprise-Grade)" -Files $schemaFiles
    $totalFiles += $schemaFiles.Count
}

# 5. Packages - Shared Types
if (Test-Path "packages\types") {
    Write-Host "`nScanning Shared Types..." -ForegroundColor Cyan
    $typeFiles = Get-ChildItem -Path "packages\types" -Include *.ts,*.d.ts -Recurse -File
    Add-FilesToContext -SectionTitle "Packages - Shared TypeScript Types" -Files $typeFiles
    $totalFiles += $typeFiles.Count
}

# 6. Packages - ESLint Config
if (Test-Path "packages\eslint-config") {
    Write-Host "`nScanning ESLint Config..." -ForegroundColor Cyan
    $eslintFiles = Get-ChildItem -Path "packages\eslint-config" -Include *.js,*.json,*.ts -Recurse -File
    Add-FilesToContext -SectionTitle "Packages - ESLint Config" -Files $eslintFiles
    $totalFiles += $eslintFiles.Count
}

# 7. Packages - TSConfig
if (Test-Path "packages\tsconfig") {
    Write-Host "`nScanning TSConfig..." -ForegroundColor Cyan
    $tsconfigFiles = Get-ChildItem -Path "packages\tsconfig" -Include *.json -Recurse -File
    Add-FilesToContext -SectionTitle "Packages - TypeScript Config" -Files $tsconfigFiles
    $totalFiles += $tsconfigFiles.Count
}

# 8. Root Config Files
Write-Host "`nAdding Root Config Files..." -ForegroundColor Cyan
$rootConfigFiles = @()
foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        $rootConfigFiles += Get-Item $file
    }
}
Add-FilesToContext -SectionTitle "Root Configuration (Monorepo)" -Files $rootConfigFiles
$totalFiles += $rootConfigFiles.Count

# 9. Backend Config Files
Write-Host "`nAdding Backend Config Files..." -ForegroundColor Cyan
$backendConfigFiles = @()
foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        $backendConfigFiles += Get-Item $file
    }
}
Add-FilesToContext -SectionTitle "Backend Configuration (NestJS)" -Files $backendConfigFiles
$totalFiles += $backendConfigFiles.Count

# 10. Frontend Config Files (if exists)
Write-Host "`nAdding Frontend Config Files..." -ForegroundColor Cyan
$frontendConfigFiles = @()
foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        $frontendConfigFiles += Get-Item $file
    }
}
if ($frontendConfigFiles.Count -gt 0) {
    Add-FilesToContext -SectionTitle "Frontend Configuration" -Files $frontendConfigFiles
    $totalFiles += $frontendConfigFiles.Count
}

# 11. Docker Files
Write-Host "`nAdding Docker Files..." -ForegroundColor Cyan
$dockerConfigFiles = @()
foreach ($file in $dockerFiles) {
    if (Test-Path $file) {
        $dockerConfigFiles += Get-Item $file
    }
}
if ($dockerConfigFiles.Count -gt 0) {
    Add-FilesToContext -SectionTitle "Docker Configuration (AWS Deployment)" -Files $dockerConfigFiles
    $totalFiles += $dockerConfigFiles.Count
}

# 12. Scripts
if (Test-Path "scripts") {
    Write-Host "`nAdding Scripts..." -ForegroundColor Cyan
    $scriptFiles = Get-ChildItem -Path "scripts" -Include *.ps1,*.sh,*.js,*.ts -File
    if ($scriptFiles.Count -gt 0) {
        Add-FilesToContext -SectionTitle "Build & Deployment Scripts" -Files $scriptFiles
        $totalFiles += $scriptFiles.Count
    }
}

# 13. GitHub Workflows (if exists)
if (Test-Path ".github\workflows") {
    Write-Host "`nAdding GitHub Workflows..." -ForegroundColor Cyan
    $workflowFiles = Get-ChildItem -Path ".github\workflows" -Include *.yml,*.yaml -File
    if ($workflowFiles.Count -gt 0) {
        Add-FilesToContext -SectionTitle "CI/CD Workflows" -Files $workflowFiles
        $totalFiles += $workflowFiles.Count
    }
}

# Summary
$fileSize = (Get-Item $outputFile).Length

"## Export Summary" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Metric | Value |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"|--------|-------|" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Files Exported | $totalFiles |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| File Size | $([math]::Round($fileSize / 1MB, 2)) MB |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"| Generated | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') IST |" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

"### What's Included" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ✅ Backend NestJS source code (apps/backend/src)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ✅ Frontend Admin source code (apps/frontend/src)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ✅ Flutter mobile app (apps/mobile/lib)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ✅ **Enterprise-Grade Prisma Schema** (packages/database/prisma)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - Lifecycle coverage: Puberty → Menopause" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - PCOS-aware fertility tracking" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - Twins/multiples support" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - Doctor availability slots" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - Payment reconciliation (Razorpay/UPI)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - ABDM/ABHA compliance (FHIR-annotated)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - Instagram-style reels support" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - pgvector ready for AI features" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ✅ Shared packages (types, eslint, tsconfig)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ✅ All configuration files" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ✅ Docker compose & deployment configs" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ✅ Build scripts & CI/CD workflows" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

"### Excluded (As Expected)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ node_modules (dependency code)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ Generated Prisma client (packages/database/generated)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ Build artifacts (dist, .turbo, .next)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ Environment files (.env - use .env.example)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ AWS credentials & secrets" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

"### AWS Architecture Notes" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"The schema includes offloading strategies for scale:" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- **PostgreSQL (RDS Aurora)**: Core health data, relational integrity" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- **DynamoDB (Offload Candidates)**:" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - UserActivityLog (WORN pattern)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - Message (high-volume chat)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - AuditLog (compliance, TTL=365 days)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"  - NotificationPreference (low-read state)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- **S3**: Media storage (photos, videos, medical documents)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- **Rekognition**: Auto content moderation" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- **MediaConvert**: Video processing for Reels" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- **Bedrock (Claude 3.5)**: AI chatbot with RAG" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "EXPORT COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Output: $outputFile" -ForegroundColor Cyan
Write-Host "Files: $totalFiles" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round($fileSize / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the exported file in data\context\" -ForegroundColor White
Write-Host "2. Upload to Claude or GPT-4 for AI code review" -ForegroundColor White
Write-Host "3. Use for documentation generation" -ForegroundColor White
Write-Host "4. Share with new developers for onboarding`n" -ForegroundColor White
