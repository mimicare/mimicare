# Mimicare Environment Configuration Guide

**Version:** 1.0.0
**Last Updated:** December 10, 2025
**Project:** Mimicare - Comprehensive Maternal & Child Care Platform

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Environment Variables Reference](#environment-variables-reference)
4. [Healthcare Compliance Requirements](#healthcare-compliance-requirements)
5. [AWS Services Architecture](#aws-services-architecture)
6. [Local Development Setup](#local-development-setup)
7. [Production Deployment](#production-deployment)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Mimicare is a comprehensive maternal and child care platform built with:

- **Frontend:** Flutter mobile app + Web admin dashboard
- **Backend:** NestJS with TypeScript
- **Architecture:** Turborepo monorepo
- **Database:** PostgreSQL with pgvector extension
- **Cache:** Redis
- **Cloud Services:** AWS (LocalStack for local development)
- **Container Runtime:** Docker/Podman

This document explains all environment variables and their purpose for both local development and production deployment.

---

## Quick Start

### 1. Initial Setup

```

# Clone and install dependencies

git clone <repository-url>
cd mimicare
yarn install

# Copy environment template

cp .env.example .env

# Generate secure secrets

openssl rand -base64 32 # For JWT secrets
openssl rand -hex 32 # For API key encryption

```

### 2. Start Local Services

**Using Docker:**

```

yarn docker:dev # Starts PostgreSQL, Redis, LocalStack

```

**Using Podman:**

```

yarn podman:dev # Starts PostgreSQL, Redis, LocalStack

```

### 3. Database Setup

```

yarn db:generate # Generate Prisma client
yarn db:migrate # Run migrations
yarn db:seed # Seed initial data (optional)

```

### 4. Start Development Servers

```

yarn dev # Start all workspaces
yarn dev:backend # Backend only
yarn dev:frontend # Frontend only

```

---

## Environment Variables Reference

### Database Configuration

#### `DATABASE_URL`

**Type:** Connection String
**Required:** Yes
**Default:** `postgresql://postgres:123@localhost:5434/mimicare?schema=public`

Full PostgreSQL connection URL including credentials, host, port, and database name.

**Format:** `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`

**Production Example:**

```

DATABASE_URL="postgresql://mimicare_user:secure_password@prod-db.example.com:5432/mimicare_prod?schema=public&sslmode=require"

```

#### `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

**Type:** String
**Required:** Yes (for Docker Compose)
**Used By:** Docker/Podman compose files

These variables are used by the PostgreSQL container at initialization.

**⚠️ Important:** Change default password in production!

---

### Application Configuration

#### `NODE_ENV`

**Type:** Enum
**Values:** `development` | `production` | `test`
**Default:** `development`

Controls application behavior, logging levels, and feature flags.

**Impact:**

- `development`: Verbose logging, hot reload, debug endpoints enabled
- `production`: Optimized builds, minimal logging, security hardened
- `test`: Test database, mock services, fixtures enabled

#### `BACKEND_PORT`

**Type:** Number
**Default:** `8000`

Port where NestJS backend server listens.

#### `FRONTEND_PORT`

**Type:** Number
**Default:** `5173`

Port for Vite development server (admin dashboard).

#### `FRONTEND_URL`

**Type:** URL
**Default:** `http://localhost:5173`

Full URL of frontend application. Used for CORS configuration and redirect URLs.

**Production Example:**

```

FRONTEND_URL="https://app.mimicare.com"

```

#### `BACKEND_URL`

**Type:** URL
**Default:** `http://localhost:8000`

Full URL of backend API. Used by frontend to make API requests.

**Production Example:**

```

BACKEND_URL="https://api.mimicare.com"

```

---

### Authentication & Security

#### `JWT_ACCESS_TOKEN_SECRET`

**Type:** String (Base64)
**Required:** Yes
**Min Length:** 32 characters

Secret key for signing JWT access tokens.

**Generate:**

```

openssl rand -base64 32

```

**⚠️ CRITICAL:** Never commit this to version control. Rotate regularly in production.

#### `JWT_REFRESH_TOKEN_SECRET`

**Type:** String (Base64)
**Required:** Yes
**Min Length:** 32 characters

Secret key for signing JWT refresh tokens. Must be different from access token secret.

**Generate:**

```

openssl rand -base64 32

```

#### `JWT_ACCESS_TOKEN_EXPIRATION`

**Type:** Time String
**Default:** `15m`
**Format:** `[number][unit]` where unit = `s`, `m`, `h`, `d`

How long access tokens remain valid.

**Recommendations:**

- Development: `15m` - `1h`
- Production: `5m` - `15m` (shorter = more secure)

#### `JWT_REFRESH_TOKEN_EXPIRATION`

**Type:** Time String
**Default:** `7d`

How long refresh tokens remain valid.

**Recommendations:**

- Development: `7d` - `30d`
- Production: `7d` - `14d`

#### `API_KEY_ENCRYPTION_SECRET`

**Type:** Hex String
**Required:** Yes
**Length:** 64 characters (32 bytes)

Used to encrypt API keys stored in database.

**Generate:**

```

openssl rand -hex 32

```

---

### OAuth Configuration (Optional)

#### Google OAuth

**Setup:** https://console.cloud.google.com/apis/credentials

1. Create OAuth 2.0 Client ID
2. Add authorized redirect URIs: `http://localhost:8000/api/v1/auth/google/callback`
3. Copy Client ID and Secret

```

GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

```

#### Apple OAuth (iOS App)

**Setup:** https://developer.apple.com/account/resources/identifiers/list

1. Register App ID with Sign in with Apple capability
2. Create Service ID
3. Generate private key
4. Configure domains and redirect URLs

```

APPLE_CLIENT_ID=com.mimicare.app
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=YYYYYYYYYY
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_YYYYYYYYYY.p8
APPLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/apple/callback

```

---

### AWS Configuration

#### `AWS_REGION`

**Type:** AWS Region Code
**Default:** `ap-south-1` (Mumbai)

Primary AWS region for all services.

**Common Regions:**

- `us-east-1` (N. Virginia)
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-south-1` (Mumbai)
- `ap-southeast-1` (Singapore)

---

### AWS LocalStack (Local Development)

LocalStack emulates AWS services locally without requiring AWS account or incurring costs.

#### `AWS_ENDPOINT_URL`

**Type:** URL
**Default:** `http://localhost:4566`

LocalStack endpoint. All AWS SDK calls are redirected here in development.

**⚠️ Important:** Remove or comment out for production to use real AWS services.

---

### S3 (File Storage)

#### Purpose

- Medical records (PDFs, lab results)
- Ultrasound images (JPEG, PNG, DICOM)
- Profile pictures
- Documents and attachments

#### Configuration

```

# LocalStack (Development)

AWS_S3_ACCESS_KEY_ID=test
AWS_S3_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET_NAME=mimicare-files-dev
AWS_S3_MEDICAL_RECORDS_BUCKET=mimicare-medical-records-dev
AWS_S3_IMAGES_BUCKET=mimicare-images-dev
AWS_S3_REGION=ap-south-1
AWS_S3_ENDPOINT=http://localhost:4566

# Production

# AWS_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE

# AWS_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# AWS_S3_BUCKET_NAME=mimicare-files-prod

# AWS_S3_MEDICAL_RECORDS_BUCKET=mimicare-medical-records-prod

# AWS_S3_IMAGES_BUCKET=mimicare-images-prod

# AWS_S3_REGION=ap-south-1

# #WS_S3_ENDPOINT= # Leave empty for real AWS

```

#### Bucket Strategy

**Separate Buckets Approach:**

- `mimicare-files-prod`: General application files
- `mimicare-medical-records-prod`: HIPAA-compliant medical records with strict access controls
- `mimicare-images-prod`: Optimized images with CloudFront CDN

**Benefits:**

- Granular access control
- Different encryption policies
- Separate lifecycle rules
- Compliance segregation

---

### SES (Email Service)

#### Purpose

- Appointment reminders
- Password reset emails
- Account verification
- Health tips and newsletters
- System notifications

#### Configuration

```

# LocalStack (Development)

AWS_SES_ACCESS_KEY_ID=test
AWS_SES_SECRET_ACCESS_KEY=test
AWS_SES_NO_REPLY_EMAIL=noreply@mimicare.local
AWS_SES_SUPPORT_EMAIL=support@mimicare.local
AWS_SES_APPOINTMENT_EMAIL=appointments@mimicare.local

```

#### Production Setup

1. Verify domain in SES Console
2. Move out of SES Sandbox (request production access)
3. Configure DKIM and SPF records
4. Set up bounce and complaint handling

```

# Production

# AWS_SES_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE

# AWS_SES_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# AWS_SES_NO_REPLY_EMAIL=noreply@mimicare.com

# AWS_SES_SUPPORT_EMAIL=support@mimicare.com

# AWS_SES_APPOINTMENT_EMAIL=appointments@mimicare.com

```

---

### DynamoDB (NoSQL Database)

#### Purpose

- High-speed session storage
- Real-time chat messages
- Appointment scheduling (quick lookups)
- Push notification queues
- Baby tracking events (feeding, diaper changes)
- Vital signs time-series data

#### Why DynamoDB?

- **Performance:** Single-digit millisecond latency
- **Scalability:** Auto-scales with demand
- **Cost:** Pay per request (serverless)
- **Time-Series Data:** Perfect for tracking baby activities and vital signs

#### Configuration

```

# LocalStack (Development)

AWS_DYNAMODB_ACCESS_KEY_ID=test
AWS_DYNAMODB_SECRET_ACCESS_KEY=test
AWS_DYNAMODB_ENDPOINT=http://localhost:4566
AWS_DYNAMODB_REGION=ap-south-1

# Table Names

AWS_DYNAMODB_APPOINTMENT_TABLE=mimicare-appointments-dev
AWS_DYNAMODB_SESSION_TABLE=mimicare-sessions-dev
AWS_DYNAMODB_CHAT_TABLE=mimicare-chat-history-dev
AWS_DYNAMODB_NOTIFICATION_TABLE=mimicare-notifications-dev
AWS_DYNAMODB_VITAL_SIGNS_TABLE=mimicare-vital-signs-dev
AWS_DYNAMODB_BABY_TRACKER_TABLE=mimicare-baby-tracker-dev

```

#### Table Design Patterns

**1. Appointments Table**

- Partition Key: `userId`
- Sort Key: `appointmentDateTime`
- GSI: `doctorId-appointmentDateTime`

**2. Chat History**

- Partition Key: `conversationId`
- Sort Key: `timestamp`
- TTL: Auto-delete after 90 days (configurable)

**3. Vital Signs**

- Partition Key: `patientId`
- Sort Key: `timestamp#vitalType`
- Use for: Blood pressure, weight, glucose levels

**4. Baby Tracker**

- Partition Key: `babyId`
- Sort Key: `timestamp#eventType`
- Track: Feeding, diaper changes, sleep, medications

---

### SQS (Queue Service)

#### Purpose

Asynchronous task processing without blocking API responses.

#### Use Cases

**1. Notification Queue (`mimicare-notifications-dev`)**

- Push notifications to mobile app
- SMS alerts
- Email notifications
- Batch processing for daily summaries

**2. Appointment Queue (`mimicare-appointments-dev`)**

- Appointment reminders (24hr, 1hr before)
- Doctor notification of new bookings
- Calendar sync
- Rescheduling workflows

**3. Email Queue (`mimicare-emails-dev`)**

- Transactional emails
- Marketing campaigns
- Scheduled health tips
- Report generation and delivery

#### Configuration

```

# LocalStack (Development)

AWS_SQS_ACCESS_KEY_ID=test
AWS_SQS_SECRET_ACCESS_KEY=test
AWS_SQS_ENDPOINT=http://localhost:4566
AWS_SQS_NOTIFICATION_QUEUE_URL=http://localhost:4566/000000000000/mimicare-notifications-dev
AWS_SQS_APPOINTMENT_QUEUE_URL=http://localhost:4566/000000000000/mimicare-appointments-dev
AWS_SQS_EMAIL_QUEUE_URL=http://localhost:4566/000000000000/mimicare-emails-dev

```

#### Queue Processing Pattern

```

// Example: Process appointment reminders
async function processAppointmentQueue() {
const messages = await sqs.receiveMessage({
QueueUrl: process.env.AWS_SQS_APPOINTMENT_QUEUE_URL,
MaxNumberOfMessages: 10,
WaitTimeSeconds: 20
});

for (const message of messages) {
const appointment = JSON.parse(message.Body);
await sendAppointmentReminder(appointment);
await sqs.deleteMessage({
QueueUrl: process.env.AWS_SQS_APPOINTMENT_QUEUE_URL,
ReceiptHandle: message.ReceiptHandle
});
}
}

```

---

### Redis Configuration

#### Purpose

- Session storage (fast user authentication)
- API response caching
- Rate limiting counters
- Real-time features (pub/sub for chat)
- Queue backend (alternative to SQS for local dev)

#### Configuration

```

# LocalStack (Development)

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mimicare123
REDIS_TLS_ENABLED=false
REDIS_DB=0

# Production (AWS ElastiCache)

# REDIS_HOST=mimicare-prod.abc123.0001.aps1.cache.amazonaws.com

# REDIS_PORT=6379

# REDIS_PASSWORD=your-strong-redis-password

# REDIS_TLS_ENABLED=true

```

#### Redis Usage Patterns

**1. Session Storage**

```

Key: session:{userId}:{sessionId}
TTL: 7 days (refresh token expiration)

```

**2. Rate Limiting**

```

Key: ratelimit:{userId}:{endpoint}
TTL: 15 minutes
Value: Request count

```

**3. Cache**

```

Key: cache:{resource}:{id}
TTL: 5 minutes (configurable per resource)

```

---

### Queue Backend Selection

#### `QUEUE_BACKEND`

**Type:** Enum
**Values:** `redis` | `sqs`
**Default:** `redis`

Choose queue backend based on environment.

**Development:** Use `redis` (simpler, faster local setup)
**Production:** Use `sqs` (managed, scalable, reliable)

```

# Development

QUEUE_BACKEND=redis

# Production

# QUEUE_BACKEND=sqs

```

---

### Telemedicine & Video Calls (Future Feature)

#### AWS Chime SDK

**Purpose:** HIPAA-compliant video consultations between patients and doctors.

**Features:**

- HD video calls
- Screen sharing
- Recording (with consent)
- Chat during calls
- Multi-participant support

**Setup (Production):**

1. Enable Chime SDK in AWS Console
2. Create Chime App Instance
3. Configure ARN and credentials

```

# AWS_CHIME_APP_INSTANCE_ARN=arn:aws:chime:region:account:app-instance/instance-id

# AWS_CHIME_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE

# AWS_CHIME_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

```

**⚠️ HIPAA Compliance:** Ensure BAA (Business Associate Agreement) is signed with AWS before handling PHI in video calls.

---

### Push Notifications

#### Firebase Cloud Messaging (FCM)

**Purpose:** Real-time notifications to Flutter mobile app.

**Use Cases:**

- Appointment reminders
- Doctor messages
- Baby milestone alerts
- Medication reminders
- Health tips

**Setup:**

1. Create Firebase project: https://console.firebase.google.com
2. Add Android and iOS apps
3. Download service account JSON
4. Extract credentials

```

FCM_SERVER_KEY=your-server-key-from-firebase-console
FCM_PROJECT_ID=mimicare-prod
FCM_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@mimicare-prod.iam.gserviceaccount.com

```

**Flutter Integration:**

```

// In Flutter app
await FirebaseMessaging.instance.getToken();
// Send token to backend for storage

```

---

### Payment Gateways (Future Feature)

#### Stripe (International)

**Purpose:** Process consultation fees, subscription payments.

**Setup:** https://dashboard.stripe.com

```

STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_ABC123...

```

**Test Cards:**

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

#### Razorpay (India)

**Purpose:** Local payment methods (UPI, wallets, net banking).

**Setup:** https://dashboard.razorpay.com

```

RAZORPAY_KEY_ID=rzp_test_ABC123
RAZORPAY_KEY_SECRET=XYZ789ABC123
RAZORPAY_WEBHOOK_SECRET=webhook_secret_key

```

**Test Mode:** Use test keys during development (no real money processed).

---

### FHIR Integration (Critical for Production)

#### ⚠️ MANDATORY FOR HEALTHCARE COMPLIANCE

**FHIR (Fast Healthcare Interoperability Resources)** is the industry standard for exchanging healthcare data.

#### Why FHIR is Critical

1. **Interoperability:** Share data with hospitals, labs, insurance providers
2. **Compliance:** Required for many healthcare regulations
3. **Standards:** Ensures data quality and consistency
4. **Future-Proof:** Built for modern healthcare ecosystems

#### Configuration

```

# Development (Local FHIR Server)

FHIR_SERVER_URL=http://localhost:8080/fhir
FHIR_VERSION=R4
ENABLE_FHIR_INTEGRATION=false

# Production

# FHIR_SERVER_URL=https://fhir.mimicare.com/api

# FHIR_API_KEY=your-fhir-api-key

# ENABLE_FHIR_INTEGRATION=true

```

#### FHIR Resources to Implement

**Phase 1 (MVP):**

- `Patient` - Patient demographics and identifiers
- `Observation` - Vital signs, pregnancy tracking metrics
- `Appointment` - Scheduled consultations

**Phase 2:**

- `Encounter` - Doctor visits and consultations
- `Condition` - Diagnoses and health conditions
- `MedicationRequest` - Prescriptions
- `DiagnosticReport` - Lab results, ultrasounds

**Phase 3:**

- `CarePlan` - Pregnancy care plans
- `Goal` - Health goals and targets
- `Immunization` - Baby vaccination records

#### FHIR Server Options

**1. HAPI FHIR (Open Source)**

- Java-based
- Fully compliant with FHIR R4
- Free and self-hosted

**2. Azure FHIR Service**

- Managed service
- HIPAA compliant
- Integrated with Azure ecosystem

**3. Google Cloud Healthcare API**

- Managed FHIR store
- ML/AI integration ready
- Auto-scaling

#### Implementation Checklist

- [ ] Choose FHIR server (HAPI, Azure, or Google Cloud)
- [ ] Map Mimicare data models to FHIR resources
- [ ] Implement FHIR client in NestJS backend
- [ ] Create synchronization jobs (Mimicare DB ↔ FHIR Server)
- [ ] Test interoperability with sample systems
- [ ] Document FHIR API endpoints
- [ ] Train team on FHIR standards

**Resources:**

- Official Spec: https://www.hl7.org/fhir/
- HAPI FHIR: https://hapifhir.io/
- Testing: http://test.fhir.org/

---

### AI/ML Features (Optional)

#### Purpose

- Pregnancy risk assessment
- Personalized health recommendations
- Symptom checker
- Baby development insights
- Nutrition suggestions

#### OpenAI Integration

```

OPENAI_API_KEY=sk-proj-abc123...

```

**Use Cases:**

- Natural language symptom analysis
- Chatbot for common pregnancy questions
- Summarize medical reports

#### Google AI Integration

```

GOOGLE_AI_API_KEY=AIzaSyABC123...

```

**Use Cases:**

- Gemini for multimodal analysis (text + images)
- Analyze ultrasound images (with doctor supervision)
- Voice-to-text for appointment notes

**⚠️ Medical Disclaimer:** AI should augment, not replace, medical professionals. Always include disclaimers and require doctor verification.

---

### File Upload Configuration

#### `MAX_FILE_SIZE`

**Type:** Bytes
**Default:** `52428800` (50MB)

Maximum size for medical record uploads (PDFs, reports).

#### `MAX_IMAGE_SIZE`

**Type:** Bytes
**Default:** `10485760` (10MB)

Maximum size for image uploads (ultrasounds, photos).

#### `ALLOWED_FILE_TYPES`

**Type:** Comma-separated string
**Default:** `pdf,jpg,jpeg,png,dcm`

Allowed file extensions.

**Note:** `dcm` is DICOM format used for medical imaging (ultrasounds, X-rays).

**Production Recommendations:**

- Validate file MIME types on server (don't trust extensions)
- Scan files for malware
- Store original + compressed versions
- Generate thumbnails for images

---

### Security & Compliance

#### HIPAA Compliance Settings

**HIPAA (Health Insurance Portability and Accountability Act)** governs healthcare data protection in the US.

#### `ENABLE_AUDIT_LOGS`

**Type:** Boolean
**Default:** `true`

Log all access to Protected Health Information (PHI).

**Logged Events:**

- Patient record views
- Medical record downloads
- Data modifications
- Failed access attempts
- Administrative actions

**Storage:** Write to DynamoDB or CloudWatch Logs with long retention (7+ years).

#### `ENABLE_DATA_ENCRYPTION`

**Type:** Boolean
**Default:** `true`

**Encryption at Rest:**

- S3: Server-side encryption (SSE-KMS)
- DynamoDB: Encrypted tables
- PostgreSQL: Transparent Data Encryption (TDE)
- Redis: Encrypted snapshots

**Encryption in Transit:**

- TLS 1.3 for all API calls
- WSS for WebSocket connections
- HTTPS only in production

#### `SESSION_TIMEOUT`

**Type:** Seconds
**Default:** `1800` (30 minutes)

Automatically log out inactive users to prevent unauthorized access.

**Recommended Values:**

- Mobile App: 30-60 minutes
- Admin Dashboard: 15-30 minutes
- Doctor Portal: 20 minutes

#### `MAX_LOGIN_ATTEMPTS`

**Type:** Number
**Default:** `5`

Maximum failed login attempts before account lockout.

#### `LOCKOUT_DURATION`

**Type:** Seconds
**Default:** `1800` (30 minutes)

How long accounts remain locked after max failed attempts.

**Alternative:** Exponential backoff (1 min, 5 min, 30 min, 24 hours).

---

### Frontend Configuration

#### Vite (Web Admin Dashboard)

```

VITE_API_URL="http://localhost:8000/api/v1"
VITE_WS_URL="ws://localhost:8000"
VITE_TOKEN_ENCRYPTION_KEY=your_super_secure_32_character_key

```

**⚠️ Important:** `VITE_` prefixed variables are exposed to client-side code. Never put secrets here!

#### Flutter App

```

FLUTTER_API_BASE_URL=http://localhost:8000/api/v1
FLUTTER_WS_URL=ws://localhost:8000
FLUTTER_APP_VERSION=1.0.0

```

**Dart Configuration:**

```

// lib/config/env.dart
class Environment {
static const String apiBaseUrl = String.fromEnvironment(
'API_BASE_URL',
defaultValue: 'http://localhost:8000/api/v1'
);
}

```

---

### Container Runtime

#### `IMAGE_REGISTRY`

**Type:** String
**Default:** `localhost/`

Where to pull container images from.

**Options:**

- `localhost/` - Use local images (no pulling)
- `docker.io/` - Pull from Docker Hub
- `ghcr.io/` - GitHub Container Registry
- `<your-ecr-url>/` - AWS ECR

#### `PULL_POLICY`

**Type:** Enum
**Values:** `never` | `missing` | `always`
**Default:** `never`

**Policies:**

- `never` - Only use local images (fail if not found)
- `missing` - Pull if not available locally
- `always` - Always pull latest version

**Local Development:**

```

IMAGE_REGISTRY=localhost/
PULL_POLICY=never

```

**CI/CD Pipeline:**

```

IMAGE_REGISTRY=docker.io/
PULL_POLICY=always

```

---

### Monitoring & Logging

#### `LOG_LEVEL`

**Type:** Enum
**Values:** `debug` | `info` | `warn` | `error`
**Default:** `debug`

**Development:** `debug` (verbose, includes SQL queries)
**Production:** `info` or `warn` (performance optimized)

#### `ENABLE_REQUEST_LOGGING`

**Type:** Boolean
**Default:** `true`

Log all HTTP requests (method, path, duration, status).

**Production Consideration:** Can generate large logs. Use sampling or log to CloudWatch.

#### `ENABLE_ERROR_TRACKING`

**Type:** Boolean
**Default:** `true`

Enable structured error logging with stack traces.

**Production:** Integrate with Sentry or Rollbar for real-time error monitoring.

---

### Rate Limiting

#### `RATE_LIMIT_ENABLED`

**Type:** Boolean
**Default:** `true`

Enable API rate limiting to prevent abuse.

#### `RATE_LIMIT_WINDOW`

**Type:** Seconds
**Default:** `900` (15 minutes)

Time window for rate limit calculations.

#### `RATE_LIMIT_MAX_REQUESTS`

**Type:** Number
**Default:** `100`

Maximum requests per IP per window.

**Example:** 100 requests per 15 minutes = ~6-7 requests per minute.

**Custom Limits by Endpoint:**

```

// In NestJS
@Throttle(10, 60) // 10 requests per 60 seconds
@Post('login')
async login() { ... }

```

---

## Healthcare Compliance Requirements

### Critical Standards to Implement

#### 1. FHIR Integration ⚠️ MANDATORY

**Status:** Not yet implemented
**Priority:** HIGH
**Timeline:** Before production launch

See [FHIR Integration](#fhir-integration-critical-for-production) section above.

#### 2. HIPAA Compliance

**Status:** Partial (audit logs, encryption enabled)
**Priority:** HIGH
**Requirements:**

- [ ] Sign BAA with all third-party services (AWS, Twilio, etc.)
- [ ] Implement access controls (RBAC)
- [ ] Regular security audits
- [ ] Incident response plan
- [ ] Employee training

**Resources:**

- HHS HIPAA Guide: https://www.hhs.gov/hipaa/
- AWS HIPAA Compliance: https://aws.amazon.com/compliance/hipaa-compliance/

#### 3. Data Privacy Regulations

**GDPR (Europe):**

- Right to access data
- Right to deletion
- Data portability
- Consent management

**PDPA (India):**

- Data localization requirements
- Consent management
- Data protection officer

**CCPA (California):**

- Privacy policy requirements
- Opt-out mechanisms

#### 4. Medical Device Regulations (If Applicable)

If app provides clinical decision support or health monitoring:

**FDA (US):**

- Software as Medical Device (SaMD) registration
- 510(k) clearance or De Novo pathway
- Quality management system (ISO 13485)

**CE Mark (Europe):**

- MDR (Medical Device Regulation) compliance
- Clinical evaluation
- Post-market surveillance

#### 5. Security Standards

**SOC 2 Type II:**

- Security, availability, confidentiality
- Annual audit by certified firm

**ISO 27001:**

- Information security management system
- Risk assessment and treatment

---

## AWS Services Architecture

### Local Development (LocalStack)

```

┌─────────────────────────────────────────────────┐
│ Mimicare Local Environment │
├─────────────────────────────────────────────────┤
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│ │PostgreSQL│ │ Redis │ │ LocalStack │ │
│ │ :5434 │ │ :6379 │ │ :4566 │ │
│ └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│ │ │ │ │
│ └─────────────┴────────────────┘ │
│ │ │
│ ┌──────▼───────┐ │
│ │ NestJS │ │
│ │ Backend │ │
│ │ :8000 │ │
│ └──────┬───────┘ │
│ │ │
│ ┌─────────────┼─────────────┐ │
│ │ │ │ │
│ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ │
│ │ Flutter │ │ Vite │ │ API │ │
│ │ App │ │ Admin │ │ Docs │ │
│ │ │ │ Dashboard│ │ │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│ │
└─────────────────────────────────────────────────┘

LocalStack Services:
├── S3 (File Storage)
├── DynamoDB (NoSQL)
├── SES (Email)
└── SQS (Queues)

```

### Production (AWS)

```

┌──────────────────────────────────────────────────────┐
│ Mimicare Production (AWS) │
├──────────────────────────────────────────────────────┤
│ │
│ ┌─────────────┐ ┌─────────────┐ │
│ │ Route 53 │────▶│ CloudFront │ │
│ │ DNS │ │ CDN │ │
│ └─────────────┘ └──────┬──────┘ │
│ │ │
│ ┌─────────┴──────────┐ │
│ │ │ │
│ ┌──────▼──────┐ ┌─────▼─────┐ │
│ │ ALB │ │ S3 │ │
│ │Load Balancer│ │ Buckets │ │
│ └──────┬──────┘ └───────────┘ │
│ │ │
│ ┌─────────┴─────────┐ │
│ │ │ │
│ ┌─────▼──────┐ ┌─────▼──────┐ │
│ │ ECS │ │ ECS │ │
│ │ Backend │ │ Backend │ │
│ │ (Task 1) │ │ (Task 2) │ │
│ └─────┬──────┘ └─────┬──────┘ │
│ │ │ │
│ └──────────┬───────┘ │
│ │ │
│ ┌───────────────┼───────────────┐ │
│ │ │ │ │
│ ┌──▼───┐ ┌──────▼──────┐ ┌────▼────┐ │
│ │ RDS │ │ ElastiCache │ │DynamoDB │ │
│ │ PG │ │ Redis │ │ Tables │ │
│ └──────┘ └─────────────┘ └─────────┘ │
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ SES │ │ SNS │ │ SQS │ │
│ │ Email │ │ SMS │ │ Queues │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│ │
│ ┌──────────────────────────────────────────┐ │
│ │ CloudWatch (Monitoring) │ │
│ └──────────────────────────────────────────┘ │
│ │
└──────────────────────────────────────────────────────┘

```

### Service Selection Guide

| Feature          | Development             | Production          |
| ---------------- | ----------------------- | ------------------- |
| **Database**     | PostgreSQL (Docker)     | RDS PostgreSQL      |
| **Cache**        | Redis (Docker)          | ElastiCache Redis   |
| **File Storage** | LocalStack S3           | AWS S3 + CloudFront |
| **NoSQL**        | LocalStack DynamoDB     | AWS DynamoDB        |
| **Email**        | LocalStack SES          | AWS SES             |
| **Queue**        | LocalStack SQS or Redis | AWS SQS             |
| **Compute**      | Local (Node.js)         | ECS Fargate         |
| **Monitoring**   | Console logs            | CloudWatch + Sentry |
| **Secrets**      | .env file               | AWS Secrets Manager |

---

## Local Development Setup

### Prerequisites

```

# Check versions

node --version # >=20.0.0
yarn --version # >=4.0.0
docker --version # or podman --version

```

### Step-by-Step Setup

#### 1. Clone Repository

```

git clone https://github.com/mimicare/mimicare.git
cd mimicare

```

#### 2. Install Dependencies

```

yarn install

```

#### 3. Environment Configuration

```

# Copy environment template

cp .env.example .env

# Generate secrets

openssl rand -base64 32 # JWT_ACCESS_TOKEN_SECRET
openssl rand -base64 32 # JWT_REFRESH_TOKEN_SECRET
openssl rand -hex 32 # API_KEY_ENCRYPTION_SECRET

# Edit .env and update secrets

nano .env # or vim, code, etc.

```

#### 4. Start Infrastructure Services

**Using Docker:**

```

yarn docker:dev

```

**Using Podman:**

```

yarn podman:dev

```

**Verify services are running:**

```

# Docker

yarn docker:db:ps

# Podman

yarn podman:db:ps

```

#### 5. Initialize Database

```

# Generate Prisma client

yarn db:generate

# Run migrations

yarn db:migrate

# (Optional) Seed sample data

yarn db:seed
yarn db:seed:patients

```

#### 6. Initialize LocalStack Services

LocalStack auto-creates services on first use, but you can pre-initialize:

```

# Create S3 buckets

aws --endpoint-url=http://localhost:4566 s3 mb s3://mimicare-files-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://mimicare-medical-records-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://mimicare-images-dev

# Create DynamoDB tables (if using init script)

# See docker/init-scripts/create-dynamodb-tables.sh

```

#### 7. Start Development Servers

```

# All services

yarn dev

# Backend only

yarn dev:backend

# Frontend only

yarn dev:frontend

```

#### 8. Verify Setup

**Backend Health Check:**

```

curl http://localhost:8000/health

# Expected: {"status":"ok","timestamp":"..."}

```

**Database Connection:**

```

yarn db:studio

# Opens Prisma Studio at http://localhost:5555

```

**LocalStack Services:**

```

curl http://localhost:4566/\_localstack/health

# Shows status of all emulated services

```

### Troubleshooting Local Setup

#### Issue: Database connection fails

**Error:** `Can't reach database server at localhost:5434`

**Solution:**

```

# Check if PostgreSQL container is running

docker ps | grep mimicare-db

# or

podman ps | grep mimicare-db

# Check logs

yarn docker:db:logs

# or

yarn podman:db:logs

# Restart database

yarn docker:db:restart

# or

yarn podman:db:restart

```

#### Issue: Redis connection fails

**Error:** `ECONNREFUSED 127.0.0.1:6379`

**Solution:**

```

# Check Redis container

docker ps | grep mimicare-redis

# Test connection

redis-cli -h localhost -p 6379 -a mimicare123 ping

# Expected: PONG

# Restart Redis

yarn docker:redis:restart

```

#### Issue: LocalStack not responding

**Error:** `Connection refused on port 4566`

**Solution:**

```

# Check LocalStack container

docker ps | grep mimicare-localstack

# Check health

curl http://localhost:4566/\_localstack/health

# Check logs

yarn docker:localstack:logs

# Restart LocalStack

yarn docker:localstack:restart

```

#### Issue: Port already in use

**Error:** `Error: listen EADDRINUSE: address already in use :::8000`

**Solution:**

```

# Find process using port

lsof -i :8000 # macOS/Linux
netstat -ano | findstr :8000 # Windows

# Kill process

kill -9 <PID>

# Or change port in .env

BACKEND_PORT=8001

```

---

## Production Deployment

### Pre-Deployment Checklist

#### Security

- [ ] Change all default passwords
- [ ] Rotate JWT secrets
- [ ] Enable HTTPS/TLS everywhere
- [ ] Set up AWS Secrets Manager
- [ ] Configure WAF rules
- [ ] Enable CloudTrail logging
- [ ] Set up GuardDuty

#### Infrastructure

- [ ] Set up VPC with private subnets
- [ ] Configure security groups
- [ ] Enable RDS automated backups
- [ ] Set up Multi-AZ for RDS
- [ ] Configure ElastiCache cluster mode
- [ ] Enable S3 versioning
- [ ] Set up CloudFront distribution
- [ ] Configure Route 53 DNS

#### Application

- [ ] Set NODE_ENV=production
- [ ] Remove LocalStack endpoints
- [ ] Configure real AWS credentials
- [ ] Set up health checks
- [ ] Configure auto-scaling
- [ ] Enable error tracking (Sentry)
- [ ] Set up monitoring dashboards
- [ ] Configure log aggregation

#### Compliance

- [ ] Sign AWS BAA for HIPAA
- [ ] Implement FHIR integration
- [ ] Complete security audit
- [ ] Document data flows
- [ ] Create incident response plan
- [ ] Set up data retention policies
- [ ] Configure backup and DR

### Environment Variables for Production

```

# Production .env (managed in AWS Secrets Manager)

NODE_ENV=production

# Database (RDS)

DATABASE_URL=postgresql://admin:${SECURE_PASSWORD}@mimicare-prod.xxxxx.ap-south-1.rds.amazonaws.com:5432/mimicare

# JWT (rotated monthly)

JWT_ACCESS_TOKEN_SECRET=${SECURE_SECRET_FROM_SECRETS_MANAGER}
JWT_REFRESH_TOKEN_SECRET=${SECURE_SECRET_FROM_SECRETS_MANAGER}

# AWS (no LocalStack)

AWS_REGION=ap-south-1

# AWS_ENDPOINT_URL= # Leave empty!

# S3 (production buckets with CloudFront)

AWS_S3_BUCKET_NAME=mimicare-files-prod
AWS_S3_MEDICAL_RECORDS_BUCKET=mimicare-medical-records-prod-encrypted
AWS_S3_IMAGES_BUCKET=mimicare-images-prod-cdn

# Redis (ElastiCache)

REDIS_HOST=mimicare-prod.xxxxx.clustercfg.aps1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_TLS_ENABLED=true
REDIS_PASSWORD=${REDIS_PASSWORD_FROM_SECRETS_MANAGER}

# Queue

QUEUE_BACKEND=sqs

# Frontend URLs

FRONTEND_URL=https://app.mimicare.com
BACKEND_URL=https://api.mimicare.com

# Monitoring

LOG_LEVEL=info
ENABLE_ERROR_TRACKING=true
SENTRY_DSN=${SENTRY_DSN}

# Rate limiting (stricter in production)

RATE_LIMIT_MAX_REQUESTS=50

```

### Deployment Options

#### Option 1: AWS ECS Fargate (Recommended)

**Pros:**

- Serverless (no server management)
- Auto-scaling
- Integrated with AWS ecosystem
- Cost-effective for variable traffic

**Steps:**

1. Build Docker image
2. Push to ECR
3. Create ECS task definition
4. Deploy service with ALB
5. Configure auto-scaling policies

#### Option 2: AWS EC2 with Auto Scaling

**Pros:**

- More control over infrastructure
- Can optimize costs with Reserved Instances
- Direct SSH access for debugging

**Steps:**

1. Create AMI with application
2. Set up Launch Template
3. Configure Auto Scaling Group
4. Attach to ALB

#### Option 3: AWS Elastic Beanstalk

**Pros:**

- Simplest AWS deployment
- Manages infrastructure automatically
- Built-in monitoring

**Steps:**

1. Install EB CLI
2. `eb init` and `eb create`
3. `eb deploy` for updates

### CI/CD Pipeline

```

# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
push:
branches: [main]

jobs:
deploy:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v3

      - name: Run tests
        run: |
          yarn install
          yarn test
          yarn test:e2e

      - name: Build backend
        run: yarn build:backend

      - name: Build Docker image
        run: |
          docker build -t mimicare-backend:${{ github.sha }} .

      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin
          docker tag mimicare-backend:${{ github.sha }} $ECR_REGISTRY/mimicare:latest
          docker push $ECR_REGISTRY/mimicare:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster mimicare-prod --service backend --force-new-deployment

```

---

## Security Best Practices

### 1. Never Commit Secrets

```

# .gitignore

.env
.env.local
.env.production
_.pem
_.key
secrets/

```

### 2. Use AWS Secrets Manager

```

// In production, fetch from Secrets Manager
import { SecretsManager } from 'aws-sdk';

async function getSecret(secretName: string) {
const client = new SecretsManager({ region: 'ap-south-1' });
const data = await client.getSecretValue({ SecretId: secretName }).promise();
return JSON.parse(data.SecretString);
}

const dbPassword = await getSecret('mimicare/prod/db-password');

```

### 3. Rotate Secrets Regularly

**JWT Secrets:** Monthly
**API Keys:** Quarterly
**Database Passwords:** Quarterly
**SSL Certificates:** Auto-renew (Let's Encrypt)

### 4. Implement Rate Limiting

Protect against DDoS and brute-force attacks:

- Login endpoints: 5 attempts per 15 minutes
- API endpoints: 100 requests per 15 minutes
- File uploads: 10 per hour

### 5. Enable Audit Logging

Log all sensitive operations:

- Authentication events
- Patient record access
- Data modifications
- Administrative actions
- Failed access attempts

### 6. Encrypt Everything

**At Rest:**

- S3: SSE-KMS
- RDS: Encryption enabled
- DynamoDB: Encrypted tables
- Backups: Encrypted

**In Transit:**

- TLS 1.3 minimum
- HTTPS only
- WSS for WebSockets
- VPN for admin access

### 7. Principle of Least Privilege

**IAM Roles:**

```

{
"Version": "2012-10-17",
"Statement": [{
"Effect": "Allow",
"Action": [
"s3:GetObject",
"s3:PutObject"
],
"Resource": "arn:aws:s3:::mimicare-files-prod/\*"
}]
}

```

Only grant necessary permissions to each service.

---

## Troubleshooting

### Common Issues

#### 1. "DATABASE_URL is not defined"

**Cause:** Environment variables not loaded

**Solution:**

```

# Ensure .env exists

ls -la .env

# Check if using correct env file

cat .env | grep DATABASE_URL

# Verify in code

console.log(process.env.DATABASE_URL);

```

#### 2. "Unable to connect to LocalStack"

**Cause:** LocalStack container not running or incorrect endpoint

**Solution:**

```

# Check container status

docker ps | grep localstack

# Verify endpoint

curl http://localhost:4566/\_localstack/health

# Check AWS SDK configuration

aws configure list

# Ensure endpoint-url is set for LocalStack

```

#### 3. "Prisma Client not generated"

**Cause:** Database schema changes not reflected

**Solution:**

```

# Regenerate Prisma client

yarn db:generate

# If schema changed, create migration

yarn db:migrate:create

# Apply migration

yarn db:migrate

```

#### 4. "Redis WRONGPASS invalid password"

**Cause:** Redis password mismatch

**Solution:**

```

# Check password in .env

cat .env | grep REDIS_PASSWORD

# Test connection

redis-cli -h localhost -p 6379 -a mimicare123 ping

# Update docker-compose if password changed

```

#### 5. "S3 Bucket does not exist"

**Cause:** LocalStack buckets not created

**Solution:**

```

# Create buckets manually

aws --endpoint-url=http://localhost:4566 s3 mb s3://mimicare-files-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://mimicare-medical-records-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://mimicare-images-dev

# List buckets

aws --endpoint-url=http://localhost:4566 s3 ls

```

### Debug Mode

Enable verbose logging:

```

# .env

LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true

# Start with debug

NODE_ENV=development yarn dev:backend

```

### Health Checks

```

# Backend

curl http://localhost:8000/health

# Database

yarn db:studio

# LocalStack

curl http://localhost:4566/\_localstack/health

# Redis

redis-cli -h localhost -p 6379 -a mimicare123 ping

```

---

## Additional Resources

### Official Documentation

- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- Turborepo: https://turbo.build/repo/docs
- Flutter: https://flutter.dev/docs
- LocalStack: https://docs.localstack.cloud

### Healthcare Standards

- FHIR: https://www.hl7.org/fhir/
- HIPAA: https://www.hhs.gov/hipaa
- DICOM: https://www.dicomstandard.org/

### AWS Services

- ECS: https://docs.aws.amazon.com/ecs/
- RDS: https://docs.aws.amazon.com/rds/
- S3: https://docs.aws.amazon.com/s3/
- DynamoDB: https://docs.aws.amazon.com/dynamodb/

### Security

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- AWS Security Best Practices: https://aws.amazon.com/security/best-practices/

---

## Changelog

### Version 1.0.0 (December 10, 2025)

- Initial environment configuration
- LocalStack setup for local development
- Docker/Podman support
- Healthcare compliance documentation
- FHIR integration guidelines

---

## Support

For questions or issues:

- Email: dev@mimicare.com
- Slack: #mimicare-dev
- GitHub Issues: https://github.com/mimicare/mimicare/issues

---

**Document maintained by:** Zahid Khan (@zahidkhandev)
**Last reviewed:** December 10, 2025

```

```
