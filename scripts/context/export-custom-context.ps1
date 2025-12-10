param(
    [string]$SpecificPath = ""
)

# RootPath is always where the script is run from
$RootPath = (Get-Location).Path
# Resolve the root path to an absolute, clean path
$RootPath = (Resolve-Path $RootPath).Path
if ($RootPath.EndsWith('\') -or $RootPath.EndsWith('/')) {
    $RootPath = $RootPath.Substring(0, $RootPath.Length - 1)
}

Write-Host "Exporting Mimicare Codebase (Source Only)..." -ForegroundColor Cyan
Write-Host "Script Root (Base Path): $RootPath" -ForegroundColor Cyan
if (-not [string]::IsNullOrEmpty($SpecificPath)) {
    Write-Host "Target Path: $SpecificPath" -ForegroundColor Yellow
}
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$outputDir = Join-Path $RootPath "data\context"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$outputDir\mimicare_$timestamp.md"

# Create output directory
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# Root-level config files (relative to RootPath)
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

# Backend config files (relative to RootPath)
$backendFiles = @(
    "apps\backend\package.json",
    "apps\backend\tsconfig.json",
    "apps\backend\tsconfig.build.json",
    "apps\backend\nest-cli.json",
    "apps\backend\.env.example"
)

# Frontend config files (relative to RootPath)
$frontendFiles = @(
    "apps\frontend\package.json",
    "apps\frontend\tsconfig.json",
    "apps\frontend\vite.config.ts",
    "apps\frontend\tailwind.config.ts",
    "apps\frontend\index.html"
)

# Flutter config files (relative to RootPath)
$flutterFiles = @(
    "apps\mobile\pubspec.yaml",
    "apps\mobile\analysis_options.yaml"
)

# Docker files (relative to RootPath)
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
        'sh' { 'bash' }
        'dart' { 'dart' }
        default { 'text' }
    }
}

# Initialize file
@"
# Mimicare: Whole-Woman Lifecycle & Family Health Platform - Codebase Export

**Project:** Maternal & Child Health Platform for India
**Tech Stack:** Flutter + NestJS + PostgreSQL + AWS
**Architecture:** Monorepo (Turborepo) with WhatsApp OTP Login
**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') IST
**Version:** 1.0.0 (MVP)
**Source Root (Base Path):** $RootPath

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
- **Instagram-Style Reels** (Community engagement)

---

"@ | Out-File -FilePath $outputFile -Encoding UTF8

# Helper function to add files
function Add-FilesToContext {
    param(
        [string]$SectionTitle,
        [array]$Files,
        [string]$BaseRootPath
    )

    if ($Files.Count -eq 0) { return }

    Write-Host "`n$SectionTitle" -ForegroundColor Yellow
    "## $SectionTitle" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

    foreach ($file in ($Files | Sort-Object FullName)) {
        # Calculate relative path from the provided BaseRootPath
        $relativePath = $file.FullName
        if ($relativePath.StartsWith($BaseRootPath)) {
            $relativePath = $relativePath.Substring($BaseRootPath.Length + 1) # +1 for the '\'
        }

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

        Write-Host "   + $relativePath" -ForegroundColor DarkGray
    }

    "---" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8

    Write-Host "   Exported $($Files.Count) files" -ForegroundColor Green
}

$totalFiles = 0
$includedSummary = ""

# Check if we are doing a full export or a specific path export
if ([string]::IsNullOrEmpty($SpecificPath)) {
    # --- FULL PROJECT EXPORT LOGIC ---
    Write-Host "Performing FULL project scan..." -ForegroundColor Green

    # 1. Backend Source
    $backendSrcPath = Join-Path $RootPath "apps\backend\src"
    if (Test-Path $backendSrcPath) {
        Write-Host "`nScanning Backend..." -ForegroundColor Cyan
        $backendSourceFiles = Get-ChildItem -Path $backendSrcPath -Include *.ts,*.js -Recurse -File
        Add-FilesToContext -SectionTitle "Backend Source Code (NestJS)" -Files $backendSourceFiles -BaseRootPath $RootPath
        $totalFiles += $backendSourceFiles.Count
    }

    # 2. Frontend Source (Admin Dashboard)
    $frontendSrcPath = Join-Path $RootPath "apps\frontend\src"
    if (Test-Path $frontendSrcPath) {
        Write-Host "`nScanning Frontend Admin..." -ForegroundColor Cyan
        $frontendCodeFiles = Get-ChildItem -Path $frontendSrcPath -Include *.ts,*.tsx,*.jsx,*.js -Recurse -File
        $frontendStyleFiles = Get-ChildItem -Path $frontendSrcPath -Include *.css,*.scss -Recurse -File
        Add-FilesToContext -SectionTitle "Frontend Admin Code (React/Vite)" -Files $frontendCodeFiles -BaseRootPath $RootPath
        Add-FilesToContext -SectionTitle "Frontend Styles" -Files $frontendStyleFiles -BaseRootPath $RootPath
        $totalFiles += ($frontendCodeFiles.Count + $frontendStyleFiles.Count)
    }

    # 3. Flutter Mobile App
    $flutterSrcPath = Join-Path $RootPath "apps\mobile\lib"
    if (Test-Path $flutterSrcPath) {
        Write-Host "`nScanning Flutter Mobile App..." -ForegroundColor Cyan
        $flutterSourceFiles = Get-ChildItem -Path $flutterSrcPath -Include *.dart -Recurse -File
        Add-FilesToContext -SectionTitle "Flutter Mobile App (Primary User Interface)" -Files $flutterSourceFiles -BaseRootPath $RootPath
        $totalFiles += $flutterSourceFiles.Count
    }

    # 4. Packages - Database (Prisma Schema) - ONLY .prisma files, NO generated client
    $databasePkgPath = Join-Path $RootPath "packages\database"
    if (Test-Path $databasePkgPath) {
        Write-Host "`nScanning Database Package..." -ForegroundColor Cyan
        $schemaFiles = @()

        # Get only .prisma files from models directory
        $prismaSchemaPath = Join-Path $databasePkgPath "prisma"
        if (Test-Path $prismaSchemaPath) {
            $schemaFiles += Get-ChildItem -Path $prismaSchemaPath -Include *.prisma -Recurse -File

            # Get migrations
            $migrationsPath = Join-Path $prismaSchemaPath "migrations"
            if (Test-Path $migrationsPath) {
                $schemaFiles += Get-ChildItem -Path $migrationsPath -Include *.sql -Recurse -File
            }
        }

        # Add package-level files
        if (Test-Path (Join-Path $databasePkgPath "package.json")) {
            $schemaFiles += Get-Item (Join-Path $databasePkgPath "package.json")
        }

        Add-FilesToContext -SectionTitle "Database - Prisma Schema (Enterprise-Grade)" -Files $schemaFiles -BaseRootPath $RootPath
        $totalFiles += $schemaFiles.Count
    }

    # 5. Packages - Shared Types
    $typesPkgPath = Join-Path $RootPath "packages\types"
    if (Test-Path $typesPkgPath) {
        Write-Host "`nScanning Shared Types..." -ForegroundColor Cyan
        $typesFiles = Get-ChildItem -Path $typesPkgPath -Include *.ts,*.d.ts -Recurse -File
        Add-FilesToContext -SectionTitle "Packages - Shared TypeScript Types" -Files $typesFiles -BaseRootPath $RootPath
        $totalFiles += $typesFiles.Count
    }

    # 6. Packages - ESLint Config
    $eslintPkgPath = Join-Path $RootPath "packages\eslint-config"
    if (Test-Path $eslintPkgPath) {
        Write-Host "`nScanning ESLint Config..." -ForegroundColor Cyan
        $eslintFiles = Get-ChildItem -Path $eslintPkgPath -Include *.js,*.json,*.ts -Recurse -File
        Add-FilesToContext -SectionTitle "Packages - ESLint Config" -Files $eslintFiles -BaseRootPath $RootPath
        $totalFiles += $eslintFiles.Count
    }

    # 7. Packages - TSConfig
    $tsconfigPkgPath = Join-Path $RootPath "packages\tsconfig"
    if (Test-Path $tsconfigPkgPath) {
        Write-Host "`nScanning TSConfig..." -ForegroundColor Cyan
        $tsconfigFiles = Get-ChildItem -Path $tsconfigPkgPath -Include *.json -Recurse -File
        Add-FilesToContext -SectionTitle "Packages - TypeScript Config" -Files $tsconfigFiles -BaseRootPath $RootPath
        $totalFiles += $tsconfigFiles.Count
    }

    # 8. Root Config Files
    Write-Host "`nAdding Root Config Files..." -ForegroundColor Cyan
    $rootConfigFiles = @()
    foreach ($file in $rootFiles) {
        $fullFilePath = Join-Path $RootPath $file
        if (Test-Path $fullFilePath) {
            $rootConfigFiles += Get-Item $fullFilePath
        }
    }
    Add-FilesToContext -SectionTitle "Root Configuration (Monorepo)" -Files $rootConfigFiles -BaseRootPath $RootPath
    $totalFiles += $rootConfigFiles.Count

    # 9. Backend Config Files
    Write-Host "`nAdding Backend Config Files..." -ForegroundColor Cyan
    $backendConfigFiles = @()
    foreach ($file in $backendFiles) {
        $fullFilePath = Join-Path $RootPath $file
        if (Test-Path $fullFilePath) {
            $backendConfigFiles += Get-Item $fullFilePath
        }
    }
    Add-FilesToContext -SectionTitle "Backend Configuration (NestJS)" -Files $backendConfigFiles -BaseRootPath $RootPath
    $totalFiles += $backendConfigFiles.Count

    # 10. Frontend Config Files
    Write-Host "`nAdding Frontend Config Files..." -ForegroundColor Cyan
    $frontendConfigFiles = @()
    foreach ($file in $frontendFiles) {
        $fullFilePath = Join-Path $RootPath $file
        if (Test-Path $fullFilePath) {
            $frontendConfigFiles += Get-Item $fullFilePath
        }
    }
    if ($frontendConfigFiles.Count -gt 0) {
        Add-FilesToContext -SectionTitle "Frontend Configuration" -Files $frontendConfigFiles -BaseRootPath $RootPath
        $totalFiles += $frontendConfigFiles.Count
    }

    # 11. Flutter Config Files
    Write-Host "`nAdding Flutter Config Files..." -ForegroundColor Cyan
    $flutterConfigFiles = @()
    foreach ($file in $flutterFiles) {
        $fullFilePath = Join-Path $RootPath $file
        if (Test-Path $fullFilePath) {
            $flutterConfigFiles += Get-Item $fullFilePath
        }
    }
    if ($flutterConfigFiles.Count -gt 0) {
        Add-FilesToContext -SectionTitle "Flutter Configuration" -Files $flutterConfigFiles -BaseRootPath $RootPath
        $totalFiles += $flutterConfigFiles.Count
    }

    # 12. Docker Files
    Write-Host "`nAdding Docker Files..." -ForegroundColor Cyan
    $dockerConfigFiles = @()
    foreach ($file in $dockerFiles) {
        $fullFilePath = Join-Path $RootPath $file
        if (Test-Path $fullFilePath) {
            $dockerConfigFiles += Get-Item $fullFilePath
        }
    }
    if ($dockerConfigFiles.Count -gt 0) {
        Add-FilesToContext -SectionTitle "Docker Configuration (AWS Deployment)" -Files $dockerConfigFiles -BaseRootPath $RootPath
        $totalFiles += $dockerConfigFiles.Count
    }

    # 13. Scripts
    $scriptsPath = Join-Path $RootPath "scripts"
    if (Test-Path $scriptsPath) {
        Write-Host "`nAdding Scripts..." -ForegroundColor Cyan
        $scriptFiles = Get-ChildItem -Path $scriptsPath -Include *.ps1,*.sh,*.js,*.ts -File
        if ($scriptFiles.Count -gt 0) {
            Add-FilesToContext -SectionTitle "Build & Deployment Scripts" -Files $scriptFiles -BaseRootPath $RootPath
            $totalFiles += $scriptFiles.Count
        }
    }

    # 14. GitHub Workflows
    $workflowsPath = Join-Path $RootPath ".github\workflows"
    if (Test-Path $workflowsPath) {
        Write-Host "`nAdding GitHub Workflows..." -ForegroundColor Cyan
        $workflowFiles = Get-ChildItem -Path $workflowsPath -Include *.yml,*.yaml -File
        if ($workflowFiles.Count -gt 0) {
            Add-FilesToContext -SectionTitle "CI/CD Workflows" -Files $workflowFiles -BaseRootPath $RootPath
            $totalFiles += $workflowFiles.Count
        }
    }

    $includedSummary = @"
- ✅ Backend NestJS source code (apps/backend/src)
- ✅ Frontend Admin source code (apps/frontend/src)
- ✅ Flutter mobile app (apps/mobile/lib)
- ✅ **Enterprise-Grade Prisma Schema** (packages/database/prisma)
- ✅ Shared packages (types, eslint, tsconfig)
- ✅ All configuration files
- ✅ Docker compose & deployment configs
- ✅ Build scripts & CI/CD workflows
"@
}
else {
    # --- SPECIFIC PATH EXPORT LOGIC ---
    $resolvedSpecificPath = $SpecificPath
    if (-not (Test-Path $resolvedSpecificPath)) {
        # Try resolving relative to root path
        $resolvedSpecificPath = Join-Path $RootPath $SpecificPath
    }

    if (Test-Path $resolvedSpecificPath) {
        $resolvedSpecificPath = (Resolve-Path $resolvedSpecificPath).Path
        Write-Host "`nScanning Specific Path: $resolvedSpecificPath" -ForegroundColor Cyan

        $specificFiles = @()
        if ((Get-Item $resolvedSpecificPath) -is [System.IO.DirectoryInfo]) {
            # It's a directory, get files recursively
            $specificFiles = Get-ChildItem -Path $resolvedSpecificPath -Recurse -File
        } else {
            # It's a single file
            $specificFiles = @(Get-Item $resolvedSpecificPath)
        }

        # Calculate a clean relative path for the section title
        $relativeSpecificPath = $resolvedSpecificPath
        if ($relativeSpecificPath.StartsWith($RootPath)) {
            $relativeSpecificPath = $relativeSpecificPath.Substring($RootPath.Length + 1)
        }

        Add-FilesToContext -SectionTitle "Specific Export: $relativeSpecificPath" -Files $specificFiles -BaseRootPath $RootPath
        $totalFiles += $specificFiles.Count

        $includedSummary = "- All files from '$relativeSpecificPath'"
    } else {
        Write-Host "Error: Specific path not found: $SpecificPath" -ForegroundColor Red
        $includedSummary = "- No files exported. Path not found: $SpecificPath"
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
$includedSummary | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

if ([string]::IsNullOrEmpty($SpecificPath)) {
    "### Schema Highlights" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "The exported Prisma schema includes:" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "- **Lifecycle Coverage**: Puberty → Reproductive → Menopause" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "- **PCOS-Aware Fertility**: Advanced cycle prediction with condition support" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "- **Twins/Multiples**: One-to-many pregnancy → children relationship" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "- **Doctor Scheduling**: Multi-clinic availability slots" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "- **Payment Reconciliation**: Razorpay/UPI transaction audit trail" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "- **ABDM Compliance**: FHIR-annotated for Indian healthcare integration" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "- **Instagram Reels**: Rich media support (video, thumbnails, duration)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "- **AWS Optimization**: pgvector ready, DynamoDB offload comments" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
}

"### Excluded (As Expected)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ node_modules (dependency code)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ Generated Prisma client (packages/database/generated)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ Build artifacts (dist, .turbo, .next, build/)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ Environment files (.env - use .env.example)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"- ❌ AWS credentials & secrets" | Out-File -FilePath $outputFile -Append -Encoding UTF8
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
