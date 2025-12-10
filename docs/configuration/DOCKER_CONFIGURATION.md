# Mimicare Docker Configuration Guide

**Version:** 1.0.0  
**Last Updated:** December 10, 2025  
**Purpose:** Local development infrastructure for Mimicare care platform

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Configuration (PostgreSQL + pgvector)](#database-configuration)
4. [LocalStack Configuration (AWS Emulation)](#localstack-configuration)
5. [Redis Configuration](#redis-configuration)
6. [Network Configuration](#network-configuration)
7. [Volume Management](#volume-management)
8. [Health Checks Explained](#health-checks-explained)
9. [Environment Variables](#environment-variables)
10. [Common Commands](#common-commands)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Mimicare uses Docker Compose to orchestrate three core infrastructure services for local development:

| Service        | Purpose                                         | Port | Image                        |
| -------------- | ----------------------------------------------- | ---- | ---------------------------- |
| **PostgreSQL** | Primary relational database with vector search  | 5434 | pgvector/pgvector:pg16       |
| **LocalStack** | AWS services emulation (S3, DynamoDB, SES, SQS) | 4566 | localstack/localstack:latest |
| **Redis**      | Cache and session storage                       | 6379 | redis:8-alpine               |

All services are connected via a shared Docker network (`mimicare_network`) and persist data using named volumes.

---

## Architecture

```

┌─────────────────────────────────────────────────────────┐
│ Mimicare Docker Network │
│ (mimicare_network) │
├─────────────────────────────────────────────────────────┤
│ │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │ PostgreSQL │ │ Redis │ │
│ │ + pgvector │ │ Cache/Queue │ │
│ │ │ │ │ │
│ │ Port: 5434 │ │ Port: 6379 │ │
│ │ Container: │ │ Container: │ │
│ │ mimicare-db │ │ mimicare-redis │ │
│ └────────────────────┘ └────────────────────┘ │
│ │
│ ┌──────────────────────────────────────────┐ │
│ │ LocalStack │ │
│ │ AWS Services Emulation │ │
│ │ │ │
│ │ - S3 (File Storage) │ │
│ │ - DynamoDB (NoSQL) │ │
│ │ - SES (Email) │ │
│ │ - SQS (Message Queue) │ │
│ │ - Lambda (Functions) │ │
│ │ │ │
│ │ Port: 4566 │ │
│ │ Container: mimicare-localstack │ │
│ └──────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────┘
│ │ │
│ │ │
▼ ▼ ▼
[NestJS Backend] [Flutter App] [Admin Dashboard]

```

---

## Database Configuration

### File: `docker/db-docker-compose.yaml`

### Service Definition

```

services:
mimicare-db:
image: ${IMAGE_REGISTRY:-docker.io/}pgvector/pgvector:pg16
pull_policy: ${PULL_POLICY:-missing}
container_name: mimicare-db
ports: - '5434:5432'
environment:
POSTGRES_USER: ${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-123}
POSTGRES_DB: ${POSTGRES_DB:-mimicare}
volumes: - mimicare_db_data:/var/lib/postgresql/data - ./init-scripts/init-pgvector.sql:/docker-entrypoint-initdb.d/init-pgvector.sql
healthcheck:
test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-postgres}']
interval: 10s
retries: 5
timeout: 5s
start_period: 10s
networks: - mimicare_network
restart: unless-stopped
deploy:
resources:
limits:
cpus: '1'
memory: 512M

```

### Configuration Breakdown

#### Image: `pgvector/pgvector:pg16`

**What it is:** PostgreSQL 16 with pgvector extension pre-installed [web:36][web:39].

**Why pgvector?**

- **Vector Search:** Store and search embeddings for AI features (e.g., semantic search for medical terms, similar symptom matching)
- **Performance:** Efficient similarity search using HNSW and IVFFlat indexes
- **Native Integration:** No external vector database needed (simplifies architecture)

**Use Cases in Mimicare:**

- Search medical records by semantic meaning
- Find similar pregnancy symptoms
- Match patients with relevant health content
- AI-powered recommendations

#### Pull Policy

```

pull_policy: ${PULL_POLICY:-missing}

```

**Options:**

- `never` - Only use local images (fails if not present)
- `missing` - Pull only if image doesn't exist locally (default)
- `always` - Always pull latest version

**Configuration via .env:**

```

# Local development (use pre-loaded images)

IMAGE_REGISTRY=localhost/
PULL_POLICY=never

# CI/CD or first-time setup

IMAGE_REGISTRY=docker.io/
PULL_POLICY=missing

```

#### Port Mapping

```

ports:

- '5434:5432'

```

**Format:** `HOST_PORT:CONTAINER_PORT`

- **5434** (host) - External port for applications to connect
- **5432** (container) - Standard PostgreSQL port inside container

**Why 5434?** Avoids conflicts with existing PostgreSQL installations on port 5432.

**Connection String:**

```

postgresql://postgres:123@localhost:5434/mimicare

```

#### Environment Variables

```

environment:
POSTGRES_USER: ${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-123}
POSTGRES_DB: ${POSTGRES_DB:-mimicare}

```

**Syntax:** `${VAR_NAME:-default_value}`

If `POSTGRES_USER` is not set in `.env`, it defaults to `postgres`.

**⚠️ Security Warning:** Change `POSTGRES_PASSWORD` in production! Default `123` is only for local development.

#### Volumes

```

volumes:

- mimicare_db_data:/var/lib/postgresql/data
- ./init-scripts/init-pgvector.sql:/docker-entrypoint-initdb.d/init-pgvector.sql

```

**1. Data Volume** (`mimicare_db_data`)

- **Purpose:** Persist database data across container restarts
- **Type:** Named volume (managed by Docker)
- **Location:** Docker's internal storage
- **Benefit:** Survives `docker-compose down` (data not lost)

**2. Init Script Volume**

- **Purpose:** Run SQL on first container startup
- **Type:** Bind mount (file from host filesystem)
- **Location:** `./init-scripts/init-pgvector.sql` (relative to compose file)

**Create the init script:**

```

# File: docker/init-scripts/init-pgvector.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Optional: Create sample vector column
-- CREATE TABLE embeddings (
-- id SERIAL PRIMARY KEY,
-- content TEXT,
-- embedding vector(1536) -- OpenAI ada-002 dimension
-- );

```

#### Health Check [web:31][web:33]

```

healthcheck:
test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-postgres}']
interval: 10s
retries: 5
timeout: 5s
start_period: 10s

```

**Purpose:** Verify PostgreSQL is fully ready to accept connections before marking as healthy [web:32].

| Parameter      | Value                    | Meaning                                               |
| -------------- | ------------------------ | ----------------------------------------------------- |
| `test`         | `pg_isready -U postgres` | Command to check database readiness                   |
| `interval`     | `10s`                    | Run check every 10 seconds                            |
| `retries`      | `5`                      | Mark unhealthy after 5 consecutive failures           |
| `timeout`      | `5s`                     | Check must complete within 5 seconds                  |
| `start_period` | `10s`                    | Grace period before first check (allows startup time) |

**Health States:**

- **starting** - Within `start_period`, failures don't count
- **healthy** - Check passes
- **unhealthy** - Failed `retries` times

**Check health:**

```

docker ps # See health status
docker inspect mimicare-db | grep Health -A 10

```

#### Network

```

networks:

- mimicare_network

```

Connects to shared network (defined at bottom of compose file). All services on this network can communicate using container names as hostnames.

**Example:** Backend can connect to `postgresql://postgres:123@mimicare-db:5432/mimicare`

#### Restart Policy

```

restart: unless-stopped

```

**Options:**

- `no` - Never restart
- `always` - Always restart (even after reboot)
- `on-failure` - Only restart if exit code != 0
- `unless-stopped` - Always restart unless manually stopped (recommended)

#### Resource Limits

```

deploy:
resources:
limits:
cpus: '1'
memory: 512M

```

**Purpose:** Prevent database from consuming all system resources.

- **CPUs:** Max 1 CPU core
- **Memory:** Max 512MB RAM

**Adjust for production:**

```

limits:
cpus: '4'
memory: 4G

```

---

## LocalStack Configuration

### File: `docker/localstack-docker-compose.yaml`

### Service Definition

```

services:
localstack:
image: ${IMAGE_REGISTRY:-docker.io/}localstack/localstack:latest
pull_policy: ${PULL_POLICY:-missing}
container_name: mimicare-localstack
ports: - '4566:4566' - '4510-4559:4510-4559'
environment: - SERVICES=s3,dynamodb,ses,sqs,lambda - DEFAULT_REGION=ap-south-1 - DEBUG=1 - PERSISTENCE=1 - AWS_ACCESS_KEY_ID=test - AWS_SECRET_ACCESS_KEY=test - GATEWAY_LISTEN=0.0.0.0:4566 - DYNAMODB_SHARED_DB=true - EAGER_SERVICE_LOADING=1
volumes: - localstack-data:/var/lib/localstack - ./docker/init-scripts:/etc/localstack/init/ready.d - /var/run/docker.sock:/var/run/docker.sock
networks: - mimicare_network
healthcheck:
test: ['CMD', 'curl', '-f', 'http://localhost:4566/_localstack/health']
interval: 10s
timeout: 5s
retries: 5
start_period: 10s
restart: unless-stopped

```

### Configuration Breakdown

#### What is LocalStack?

LocalStack emulates AWS services locally without requiring AWS account or incurring costs [web:37][web:40]. Perfect for development and testing.

**Benefits:**

- **Cost:** Free (no AWS charges during development)
- **Speed:** No network latency to real AWS
- **Privacy:** Data never leaves your machine
- **Isolation:** Safe to experiment without affecting production

#### Port Mapping

```

ports:

- '4566:4566'
- '4510-4559:4510-4559'

```

- **4566** - Main gateway for all AWS services
- **4510-4559** - Range for external services (Lambda execution, etc.)

**All AWS SDK calls go to:** `http://localhost:4566`

#### Environment Variables

##### `SERVICES`

```

SERVICES=s3,dynamodb,ses,sqs,lambda

```

**Enables specific AWS services** [web:37]:

| Service      | Purpose in Mimicare                                        |
| ------------ | ---------------------------------------------------------- |
| **S3**       | Store medical records, ultrasound images, profile pictures |
| **DynamoDB** | Fast NoSQL storage for sessions, chat history, vital signs |
| **SES**      | Send appointment reminders and notification emails         |
| **SQS**      | Queue background tasks (email sending, notifications)      |
| **Lambda**   | Execute serverless functions (future feature)              |

**Add more services:**

```

SERVICES=s3,dynamodb,ses,sqs,lambda,sns,secretsmanager

```

##### `DEFAULT_REGION`

```

DEFAULT_REGION=ap-south-1

```

Sets default AWS region (Mumbai). All services use this region unless overridden.

##### `DEBUG`

```

DEBUG=1

```

**Enables verbose logging.** Helpful for troubleshooting but generates large logs.

**Disable in production-like testing:**

```

DEBUG=0

```

##### `PERSISTENCE`

```

PERSISTENCE=1

```

**Saves service state to disk.** Data survives container restarts.

**Without persistence:** S3 buckets, DynamoDB tables reset on restart.
**With persistence:** Data preserved in `/var/lib/localstack` volume.

##### `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`

```

AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

```

**Dummy credentials for LocalStack.** Real AWS ignores these; LocalStack requires them for API compatibility.

**In your application:**

```

// .env
AWS_S3_ACCESS_KEY_ID=test
AWS_S3_SECRET_ACCESS_KEY=test
AWS_S3_ENDPOINT=http://localhost:4566 // Critical!

```

##### `GATEWAY_LISTEN`

```

GATEWAY_LISTEN=0.0.0.0:4566

```

**Bind to all network interfaces.** Allows access from:

- Host machine (`localhost:4566`)
- Other Docker containers (`localstack:4566`)
- Docker Desktop VM (macOS/Windows)

##### `DYNAMODB_SHARED_DB`

```

DYNAMODB_SHARED_DB=true

```

**Use single database for all DynamoDB tables.** Improves performance and reduces memory usage in development.

**Without this:** Each table gets separate SQLite file (slower).

##### `EAGER_SERVICE_LOADING`

```

EAGER_SERVICE_LOADING=1

```

**Start all services immediately on container startup** rather than lazy-loading on first use.

**Benefit:** Faster first API call (services already initialized).
**Trade-off:** Slightly longer container startup time.

#### Volumes

```

volumes:

- localstack-data:/var/lib/localstack
- ./docker/init-scripts:/etc/localstack/init/ready.d
- /var/run/docker.sock:/var/run/docker.sock

```

**1. Data Persistence Volume**

- Stores service state (S3 objects, DynamoDB tables)
- Survives restarts

**2. Init Scripts Directory**

- Scripts run when LocalStack is ready
- Create buckets, tables automatically

**Example init script:**

```

#!/bin/bash

# File: docker/init-scripts/01-create-s3-buckets.sh

# Create S3 buckets

awslocal s3 mb s3://mimicare-files-dev
awslocal s3 mb s3://mimicare-medical-records-dev
awslocal s3 mb s3://mimicare-images-dev

# Create DynamoDB tables

awslocal dynamodb create-table \
 --table-name mimicare-appointments-dev \
 --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=appointmentDateTime,AttributeType=S \
 --key-schema AttributeName=userId,KeyType=HASH AttributeName=appointmentDateTime,KeyType=RANGE \
 --billing-mode PAY_PER_REQUEST

echo "LocalStack initialization complete!"

```

**Make executable:**

```

chmod +x docker/init-scripts/\*.sh

```

**3. Docker Socket**

```

/var/run/docker.sock:/var/run/docker.sock

```

**Required for Lambda execution.** Allows LocalStack to spawn new containers for Lambda functions.

**⚠️ Security Note:** Gives container access to Docker daemon. Only for development!

#### Health Check [web:31]

```

healthcheck:
test: ['CMD', 'curl', '-f', 'http://localhost:4566/_localstack/health']
interval: 10s
timeout: 5s
retries: 5
start_period: 10s

```

**Verifies LocalStack API is responding.**

**Health endpoint response:**

```

{
"services": {
"s3": "running",
"dynamodb": "running",
"ses": "running",
"sqs": "running",
"lambda": "running"
}
}

```

**Check health manually:**

```

curl http://localhost:4566/\_localstack/health | jq

```

---

## Redis Configuration

### File: `docker/redis-docker-compose.yaml`

### Service Definition

```

services:
redis:
image: ${IMAGE_REGISTRY:-docker.io/library/}redis:8-alpine
pull_policy: ${PULL_POLICY:-missing}
container_name: mimicare-redis
ports: - '6379:6379'
command: redis-server --requirepass mimicare123
volumes: - redis-data:/data
networks: - mimicare_network
healthcheck:
test: ['CMD', 'redis-cli', '-a mimicare123', 'ping']
interval: 10s
timeout: 5s
retries: 5

```

### Configuration Breakdown

#### Image: `redis:8-alpine`

**Why Alpine?**

- **Small size:** ~10MB vs ~100MB for standard Redis image
- **Security:** Minimal attack surface
- **Fast:** Quick to pull and start

**Version 8:** Latest stable Redis with improved performance and features.

#### Port Mapping

```

ports:

- '6379:6379'

```

Standard Redis port. Accessible at `localhost:6379`.

#### Custom Command

```

command: redis-server --requirepass mimicare123

```

**Overrides default command to add password authentication.**

**Without password:** Redis accepts all connections (insecure).
**With password:** Clients must authenticate.

**Configuration Options:**

```

# Multiple options

command: redis-server --requirepass mimicare123 --maxmemory 256mb --maxmemory-policy allkeys-lru

```

**Common Options:**

- `--requirepass` - Set password
- `--maxmemory` - Limit memory usage
- `--maxmemory-policy` - Eviction policy (LRU, LFU, etc.)
- `--appendonly yes` - Enable AOF persistence

#### Volume

```

volumes:

- redis-data:/data

```

**Persists Redis data** (if persistence enabled).

**Default behavior:** Redis stores data in memory only (lost on restart).
**With volume + AOF/RDB:** Data persists across restarts.

**Enable persistence:**

```

command: redis-server --requirepass mimicare123 --appendonly yes --save 60 1000

```

- `--appendonly yes` - AOF (Append Only File) persistence
- `--save 60 1000` - RDB snapshot every 60s if 1000+ keys changed

#### Health Check

```

healthcheck:
test: ['CMD', 'redis-cli', '-a mimicare123', 'ping']
interval: 10s
timeout: 5s
retries: 5

```

**Uses `redis-cli` to ping server.**

- `-a mimicare123` - Authenticate with password
- `ping` - Command that returns `PONG` if healthy

**Test manually:**

```

docker exec mimicare-redis redis-cli -a mimicare123 ping

# Output: PONG

```

---

## Network Configuration

### Shared Network

```

networks:
mimicare_network:
driver: bridge

```

**Purpose:** Allow containers to communicate with each other.

**Bridge Network:**

- Default Docker network type
- Isolated from host network
- Containers can reach each other by container name
- Containers can reach internet

**Container Communication:**

```

// From NestJS backend
const dbUrl = 'postgresql://postgres:123@mimicare-db:5432/mimicare';
const redisUrl = 'redis://:mimicare123@mimicare-redis:6379';
const awsEndpoint = 'http://mimicare-localstack:4566';

```

**Note:** Use container names as hostnames, not `localhost`!

**Network Inspection:**

```

docker network ls
docker network inspect mimicare_mimicare_network

```

---

## Volume Management

### Named Volumes

```

volumes:
mimicare_db_data:
driver: local
localstack-data:
driver: local
redis-data:
driver: local

```

**Purpose:** Persist data across container lifecycle.

### Volume Operations

**List volumes:**

```

docker volume ls | grep mimicare

```

**Inspect volume:**

```

docker volume inspect mimicare_mimicare_db_data

```

**Backup database volume:**

```

# Create backup

docker run --rm -v mimicare_mimicare_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data

# Restore backup

docker run --rm -v mimicare_mimicare_db_data:/data -v $(pwd):/backup alpine tar xzf /backup/db-backup.tar.gz -C /

```

**Delete volumes (⚠️ DELETES DATA):**

```

# Stop containers first

yarn docker:dev:down

# Delete volumes

yarn docker:db:clean
yarn docker:redis:clean
yarn docker:localstack:clean

# Or all at once

yarn docker:dev:clean

```

**Recreate from scratch:**

```

yarn docker:dev:clean
yarn docker:dev
yarn db:migrate

```

---

## Health Checks Explained

### Why Health Checks Matter [web:32][web:35]

**Problem:** Container running ≠ Service ready

**Example:**

```

✓ PostgreSQL container started
✗ Database still initializing
✗ Application tries to connect
✗ Connection fails

```

**With health checks:**

```

✓ PostgreSQL container started
⏳ Health check: starting (grace period)
⏳ Health check: starting (still initializing)
✓ Health check: healthy (ready for connections)
✓ Application connects successfully

```

### Health Check Lifecycle [web:31][web:33]

```

Container Start
│
▼
┌─────────────────┐
│ start_period │ Grace period - failures don't count
│ (10 seconds) │ Allows service to initialize
└────────┬────────┘
│
▼
First Check
│
┌────┴────┐
│ │
▼ ▼
Healthy Unhealthy
│ │
│ ┌────▼─────┐
│ │ Retry │
│ │ (5 times)│
│ └────┬─────┘
│ │
│ ┌────┴────┐
│ │ │
▼ ▼ ▼
Healthy Unhealthy
│
┌─────▼──────┐
│ Docker │
│ can kill │
│ & restart │
└────────────┘

```

### Health Check Best Practices [web:35]

**1. Check actual functionality**

```

# Bad - only checks if process exists

test: ['CMD', 'ps', 'aux', '|', 'grep', 'postgres']

# Good - verifies database accepts connections

test: ['CMD-SHELL', 'pg_isready -U postgres']

```

**2. Balance frequency and load**

```

# Too frequent - wastes resources

interval: 1s

# Too infrequent - slow failure detection

interval: 60s

# Good balance

interval: 10s

```

**3. Appropriate timeout**

```

# Database queries can be slow during startup

timeout: 5s

# API endpoints should be fast

timeout: 2s

```

**4. Sufficient retries**

```

# Too few - false positives from transient failures

retries: 1

# Too many - delays failure detection

retries: 20

# Good balance

retries: 5

```

**5. Adequate start period**

```

# PostgreSQL with large data

start_period: 30s

# Redis (fast startup)

start_period: 10s

```

### Monitor Health Status

**View health in ps output:**

```

docker ps

# CONTAINER STATUS

# mimicare-db Up 2 minutes (healthy)

```

**Detailed health info:**

```

docker inspect mimicare-db --format='{{json .State.Health}}' | jq

```

**Output:**

```

{
"Status": "healthy",
"FailingStreak": 0,
"Log": [
{
"Start": "2025-12-10T06:00:00Z",
"End": "2025-12-10T06:00:01Z",
"ExitCode": 0,
"Output": "accepting connections"
}
]
}

```

**Watch health status:**

```

watch -n 2 'docker ps --format "table {{.Names}}\t{{.Status}}"'

```

---

## Environment Variables

### Container Runtime Variables

#### `IMAGE_REGISTRY`

**Purpose:** Where to pull images from.

```

# Use local images (Podman/Docker)

IMAGE_REGISTRY=localhost/

# Use Docker Hub

IMAGE_REGISTRY=docker.io/

# Use GitHub Container Registry

IMAGE_REGISTRY=ghcr.io/your-org/

# Use AWS ECR

IMAGE_REGISTRY=123456789.dkr.ecr.ap-south-1.amazonaws.com/

```

#### `PULL_POLICY`

**Purpose:** When to pull images.

```

# Never pull (use local only)

PULL_POLICY=never

# Pull if not exists locally (default)

PULL_POLICY=missing

# Always pull latest

PULL_POLICY=always

```

### Database Variables

```

POSTGRES_USER=postgres
POSTGRES_PASSWORD=123
POSTGRES_DB=mimicare

```

**Used by:** PostgreSQL container during initialization.

**Change password:**

```

# 1. Update .env

POSTGRES_PASSWORD=secure_password_here

# 2. Recreate container

yarn docker:db:down
yarn docker:db:clean
yarn docker:db:up

# 3. Update DATABASE_URL

DATABASE_URL="postgresql://postgres:secure_password_here@localhost:5434/mimicare"

```

---

## Common Commands

### Start Services

```

# All services

yarn docker:dev

# or

yarn podman:dev

# Individual services

yarn docker:db:up
yarn docker:redis:up
yarn docker:localstack:up

```

### Stop Services

```

# All services

yarn docker:dev:down

# Individual services

yarn docker:db:down
yarn docker:redis:down
yarn docker:localstack:down

```

### Restart Services

```

# All services

yarn docker:dev:restart

# Individual services

yarn docker:db:restart
yarn docker:redis:restart
yarn docker:localstack:restart

```

### View Logs

```

# All services (mixed)

docker compose -f docker/db-docker-compose.yaml -f docker/redis-docker-compose.yaml -f docker/localstack-docker-compose.yaml logs -f

# Individual services

yarn docker:db:logs
yarn docker:redis:logs
yarn docker:localstack:logs

# Last 100 lines

yarn docker:db:logs --tail=100

# Since 10 minutes ago

yarn docker:db:logs --since 10m

```

### Check Status

```

# List running containers

docker ps

# Specific service

yarn docker:db:ps

# Resource usage

docker stats

```

### Clean Up

```

# Stop and remove containers (keeps data)

yarn docker:dev:down

# Stop, remove containers, and DELETE VOLUMES

yarn docker:dev:clean

# Clean specific service

yarn docker:db:clean

```

### Access Containers

```

# PostgreSQL shell

docker exec -it mimicare-db psql -U postgres -d mimicare

# Redis CLI

docker exec -it mimicare-redis redis-cli -a mimicare123

# LocalStack bash

docker exec -it mimicare-localstack bash

# Check LocalStack services

docker exec -it mimicare-localstack awslocal s3 ls

```

---

## Troubleshooting

### Issue: Port Already in Use

**Error:**

```

Error starting service: Ports are not available: exposing port TCP 0.0.0.0:5434 -> 0.0.0.0:0: listen tcp 0.0.0.0:5434: bind: address already in use

```

**Solution:**

```

# Find process using port

lsof -i :5434

# or

netstat -ano | grep 5434

# Kill process

kill -9 <PID>

# Or change port in compose file

ports:

- '5435:5432'

```

### Issue: Container Unhealthy

**Check health:**

```

docker ps

# STATUS: Up 2 minutes (unhealthy)

# View health check logs

docker inspect mimicare-db --format='{{json .State.Health.Log}}' | jq

```

**Common causes:**

- Service not fully started (wait longer)
- Wrong health check command
- Insufficient resources

**Fix:**

```

# Increase start_period

start_period: 30s

# Increase memory

deploy:
resources:
limits:
memory: 1G

```

### Issue: Cannot Connect to Database

**Error:** `ECONNREFUSED 127.0.0.1:5434`

**Check:**

```

# 1. Is container running?

docker ps | grep mimicare-db

# 2. Is it healthy?

docker ps --format "table {{.Names}}\t{{.Status}}"

# 3. Can you connect from host?

psql "postgresql://postgres:123@localhost:5434/mimicare"

# 4. Check logs

yarn docker:db:logs

```

**Solution:**

```

# Restart container

yarn docker:db:restart

# Recreate from scratch

yarn docker:db:clean
yarn docker:db:up

```

### Issue: LocalStack Services Not Responding

**Error:** `Could not connect to the endpoint URL: "http://localhost:4566/"`

**Check:**

```

# 1. Is LocalStack running?

docker ps | grep localstack

# 2. Check health endpoint

curl http://localhost:4566/\_localstack/health

# 3. Check service status

docker exec -it mimicare-localstack awslocal s3 ls

```

**Common causes:**

- LocalStack still initializing (wait 30s after startup)
- Wrong endpoint in app (should be `http://localhost:4566`)
- Missing AWS credentials in app config

**Solution:**

```

# Check logs for errors

yarn docker:localstack:logs

# Restart LocalStack

yarn docker:localstack:restart

# Verify endpoint in .env

AWS_ENDPOINT_URL=http://localhost:4566

```

### Issue: Redis AUTH Failed

**Error:** `WRONGPASS invalid username-password pair`

**Check password:**

```

# Test connection

docker exec -it mimicare-redis redis-cli -a mimicare123 ping

# Check .env matches compose file

cat .env | grep REDIS_PASSWORD

```

**Solution:**

```

# Update password in both places

# 1. docker/redis-docker-compose.yaml

command: redis-server --requirepass NEW_PASSWORD

# 2. .env

REDIS_PASSWORD=NEW_PASSWORD

# Restart Redis

yarn docker:redis:restart

```

### Issue: Data Lost After Restart

**Cause:** Volumes deleted accidentally.

**Prevention:**

```

# Use 'down' (keeps volumes)

yarn docker:dev:down

# Don't use 'clean' unless you want to delete data

# yarn docker:dev:clean # DELETES VOLUMES!

```

**Recovery:**

```

# Check if volumes exist

docker volume ls | grep mimicare

# If deleted, restore from backup

docker run --rm -v mimicare_mimicare_db_data:/data -v $(pwd):/backup alpine tar xzf /backup/db-backup.tar.gz -C /

# If no backup, recreate database

yarn db:migrate
yarn db:seed

```

### Issue: Slow Performance

**Causes:**

- Insufficient resources
- Too many services running
- Docker Desktop resource limits (macOS/Windows)

**Solutions:**

```

# Increase Docker Desktop resources

# Settings → Resources → Advanced

# CPUs: 4

# Memory: 8GB

# Reduce container limits

deploy:
resources:
limits:
cpus: '0.5'
memory: 256M

# Use Alpine images (smaller)

image: postgres:16-alpine

```

---

## Additional Resources

- **Docker Compose:** https://docs.docker.com/compose/
- **pgvector:** https://github.com/pgvector/pgvector
- **LocalStack:** https://docs.localstack.cloud/
- **Redis:** https://redis.io/docs/
- **Health Checks:** https://docs.docker.com/engine/reference/builder/#healthcheck

---

**Document maintained by:** Zahid Khan (@zahidkhandev)
**Last reviewed:** December 10, 2025

```

```
