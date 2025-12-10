# Docker Image Downloader for Mimicare

Offline Docker image downloader for Mimicare's infrastructure services. Downloads images from Docker Hub without requiring Docker daemon to be running.

## Overview

This script downloads Docker images required for Mimicare development:

- **PostgreSQL 17 with pgvector** - Primary database with vector similarity search
- **Redis 8 Alpine** - Cache and session store
- **LocalStack** - AWS services emulation for local development

Perfect for air-gapped environments, slow connections, or offline development setups [web:73][web:75].

## Prerequisites

### Required Software

| Software             | Version | Purpose                 |
| -------------------- | ------- | ----------------------- |
| **Python**           | 3.7+    | Run the download script |
| **Node.js**          | 20+     | Run yarn commands       |
| **Yarn**             | 4.0+    | Package manager         |
| **Docker or Podman** | Latest  | Load and run images     |

### Install Python

**Windows:**

```

# Via Microsoft Store

winget install Python.Python.3.12

# Or download from

https://www.python.org/downloads/

```

**macOS:**

```

brew install python@3.12

```

**Linux:**

```

# Ubuntu/Debian

sudo apt install python3 python3-pip

# Fedora/RHEL

sudo dnf install python3 python3-pip

```

### Install Python Dependencies

From project root:

```

# Install requests library

pip install requests

# Or from requirements file

cd scripts/docker
pip install -r requirements.txt

```

Create `scripts/docker/requirements.txt`:

```

requests>=2.31.0

```

## Quick Start

### From Project Root

```

# 1. Download all images

yarn docker:images:download

# 2. Load images into Docker

yarn docker:images:load

# 3. Start all services

yarn docker:dev

# 4. Verify

yarn docker:health

```

## File Structure

```

scripts/
└── docker/
├── README.md # This file
├── download-docker-image.py # Download script
├── images_to_download.txt # Image list
├── requirements.txt # Python dependencies
├── images/ # Temporary extraction (auto-cleaned)
      ├── pgvector_pgvector_pg17_amd64.tar # Final TAR (180 MB)
      ├── redis_8-alpine_amd64.tar # Final TAR (35 MB)
      └── localstack_localstack_latest_amd64.tar # Final TAR (800 MB)
```

## Usage

### Download Images (Online Machine)

```

# From project root

yarn docker:images:download

# What it does:

# 1. cd scripts/docker

# 2. python download-docker-image.py batch images_to_download.txt

# 3. Downloads to: scripts/docker/\*.tar

# 4. Cleanup temporary files in images/ folder

```

### Transfer Images (Offline Setup)

If downloading on a different machine:

```

# 1. On machine with internet - download

yarn docker:images:download

# 2. Copy TAR files to USB/network drive

cp scripts/docker/\*.tar /path/to/transfer/

# 3. On offline machine - copy TARs

cp /path/to/transfer/\*.tar scripts/docker/

# 4. Load images

yarn docker:images:load

```

### Load Images into Docker

```

# Load all TAR files

yarn docker:images:load

# Verify loaded images

docker images | grep -E "pgvector|redis|localstack"

```

### Load Images into Podman

```

# Load all TAR files

yarn podman:images:load

# Verify loaded images

podman images | grep -E "pgvector|redis|localstack"

```

## Image Details

### Required Images

| Image                   | Tag      | Size (Compressed) | Purpose                                   |
| ----------------------- | -------- | ----------------- | ----------------------------------------- |
| `pgvector/pgvector`     | pg17     | ~180 MB           | PostgreSQL 17.6 + pgvector 0.8.0 [web:51] |
| `redis`                 | 8-alpine | ~35 MB            | Redis 8.0 GA on Alpine Linux              |
| `localstack/localstack` | latest   | ~800 MB           | AWS services emulation                    |

**Total Download:** ~1 GB

### Image Versions

Configured in `scripts/docker/images_to_download.txt`:

```

# Database - PostgreSQL 17 with pgvector 0.8.0

pgvector/pgvector:pg17

# Cache & Session Store - Redis 8 (stable)

redis:8-alpine

# AWS Local Development Stack

localstack/localstack:latest

```

## Available Yarn Commands

### Download & Load

```

# Download images from Docker Hub

yarn docker:images:download

# Load images into Docker

yarn docker:images:load

# Load images into Podman

yarn podman:images:load

```

### Docker Service Management

```

# Start all services (DB + Redis + LocalStack)

yarn docker:dev

# Start individual services

yarn docker:db:up # PostgreSQL only
yarn docker:redis:up # Redis only
yarn docker:localstack:up # LocalStack only

# Stop all services

yarn docker:dev:down

# View logs

yarn docker:logs # All services
yarn docker:db:logs # PostgreSQL only
yarn docker:redis:logs # Redis only

# Health check

yarn docker:health

# Clean up (⚠️ deletes data)

yarn docker:dev:clean

```

### Podman Service Management

```

# Start all services

yarn podman:dev

# Individual services

yarn podman:db:up
yarn podman:redis:up
yarn podman:localstack:up

# Stop all

yarn podman:dev:down

# Health check

yarn podman:health

# Clean up

yarn podman:dev:clean

```

## Direct Python Usage

If you prefer not to use yarn:

```

cd scripts/docker

# Download single image

python download-docker-image.py pgvector/pgvector pg17

# Download all from batch file

python download-docker-image.py batch images_to_download.txt

# Custom batch file

python download-docker-image.py batch my-images.txt

```

## Troubleshooting

### Python Not Found (Windows)

```

# Install Python

winget install Python.Python.3.12

# Restart PowerShell

# Verify

python --version

```

### SSL Certificate Errors

```

# Upgrade certifi

pip install --upgrade certifi requests

# Or set certificate path

export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

```

### Docker Hub Rate Limiting

Docker Hub limits anonymous pulls to 100 per 6 hours [web:72].

**Solutions:**

1. Wait a few hours and retry
2. Login to Docker Hub (increases to 200/6h):

```

docker login

```

3. Download images one at a time with delays

### Out of Disk Space

```

# Check available space

df -h

# Clean Docker/Podman cache

docker system prune -a

# or

podman system prune -a

# Remove unused images

docker image prune -a

```

### Failed Downloads

```

# Retry with verbose output

cd scripts/docker
python -v download-docker-image.py batch images_to_download.txt

# Or download individually

python download-docker-image.py pgvector/pgvector pg17
python download-docker-image.py redis 8-alpine
python download-docker-image.py localstack/localstack latest

```

### Permission Denied (Linux/macOS)

```

# Make script executable

chmod +x scripts/docker/download-docker-image.py

# Or run with python explicitly

python3 scripts/docker/download-docker-image.py batch images_to_download.txt

```

## Platform Support

The script automatically detects your platform:

| Platform            | Architecture | Detected As   |
| ------------------- | ------------ | ------------- |
| Windows x64         | AMD64/x86_64 | `linux/amd64` |
| macOS Intel         | AMD64/x86_64 | `linux/amd64` |
| macOS Apple Silicon | ARM64        | `linux/arm64` |
| Linux x64           | AMD64/x86_64 | `linux/amd64` |
| Linux ARM           | ARM64        | `linux/arm64` |

## Verify Installation

After loading images:

```

# Check PostgreSQL

docker run --rm pgvector/pgvector:pg17 postgres --version

# Check Redis

docker run --rm redis:8-alpine redis-server --version

# Check LocalStack

docker run --rm localstack/localstack:latest --version

```

## Complete Setup Workflow

### First-Time Setup (Online)

```

# 1. Clone repository

git clone <repository-url>
cd mimicare

# 2. Install dependencies

yarn install

# 3. Download Docker images

yarn docker:images:download

# 4. Load images

yarn docker:images:load

# 5. Start services and run migrations

yarn setup:dev

# 6. Verify everything is running

yarn docker:health

```

### First-Time Setup (Offline)

```

# === On machine with internet ===

# 1. Download images

yarn docker:images:download

# 2. Copy scripts/docker/\*.tar to USB drive

# === On offline machine ===

# 3. Copy TAR files to project

cp /media/usb/\*.tar scripts/docker/

# 4. Install dependencies (requires offline npm registry or node_modules)

yarn install --offline

# 5. Load images

yarn docker:images:load

# 6. Start services

yarn docker:dev

# 7. Generate Prisma client

yarn db:generate

# 8. Run migrations

yarn db:migrate:deploy

```

## Integration with Development

### Daily Development Workflow

```

# Start services

yarn docker:dev

# In separate terminal - start backend

yarn dev:backend

# In another terminal - start frontend (if applicable)

yarn dev:frontend

# Stop services when done

yarn docker:dev:down

```

### CI/CD Integration

Add to `.github/workflows/ci.yml`:

```

jobs:
test:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          yarn install
          pip install requests

      - name: Download Docker images
        run: yarn docker:images:download

      - name: Load images
        run: yarn docker:images:load

      - name: Start services
        run: yarn docker:dev

      - name: Run tests
        run: yarn test

```

## Security Notes

⚠️ **SSL Verification**: The script uses `verify=False` for simplicity. For production:

1. Enable SSL verification in the script
2. Use authenticated Docker Hub access
3. Verify image signatures with Docker Content Trust

## Support & Resources

- **Docker Hub**: https://hub.docker.com
- **pgvector**: https://github.com/pgvector/pgvector
- **Redis Docs**: https://redis.io/docs
- **LocalStack Docs**: https://docs.localstack.cloud

## License

MIT

## Author

Zahid Khan (@zahidkhandev)

---

**Need Help?** Check the main project README or open an issue on GitHub.

```

```
