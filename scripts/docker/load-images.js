#!/usr/bin/env node

/**
 * Cross-platform script to load Docker/Podman images from TAR files
 * Works on Windows, macOS, and Linux
 *
 * Usage:
 *   node scripts/docker/load-images.js docker
 *   node scripts/docker/load-images.js podman
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const runtime = process.argv[2] || 'docker'; // 'docker' or 'podman'
const imagesDir = path.join(__dirname, 'images'); // TAR files are in images/ subdirectory

console.log(`\n========================================`);
console.log(`  Loading images into ${runtime.toUpperCase()}`);
console.log(`========================================\n`);

// Check if directory exists
if (!fs.existsSync(imagesDir)) {
  console.error(`❌ Directory not found: ${imagesDir}`);
  console.error(`\n💡 Run 'yarn docker:images:download' first to download images`);
  process.exit(1);
}

// Find all .tar files
const tarFiles = fs
  .readdirSync(imagesDir)
  .filter((file) => file.endsWith('.tar'))
  .map((file) => path.join(imagesDir, file));

if (tarFiles.length === 0) {
  console.error(`❌ No TAR files found in ${imagesDir}`);
  console.error(`\n💡 Run 'yarn docker:images:download' first to download images`);
  process.exit(1);
}

console.log(`Found ${tarFiles.length} image(s) to load:\n`);

let successCount = 0;
let failureCount = 0;

tarFiles.forEach((tarFile, index) => {
  const fileName = path.basename(tarFile);
  console.log(`[${index + 1}/${tarFiles.length}] Loading: ${fileName}`);

  try {
    // Use cross-platform command with proper quoting
    const command = `${runtime} load -i "${tarFile}"`;
    execSync(command, {
      stdio: 'inherit',
      shell: process.platform === 'win32' ? 'powershell.exe' : undefined,
    });
    console.log(`✅ Successfully loaded: ${fileName}\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to load: ${fileName}`);
    console.error(`   Error: ${error.message}\n`);
    failureCount++;
  }
});

console.log(`\n========================================`);
console.log(`  Summary`);
console.log(`========================================`);
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Failed:  ${failureCount}`);
console.log(`========================================\n`);

if (failureCount > 0) {
  console.error(`⚠️  Some images failed to load`);
  console.error(`Check the errors above for details\n`);
  process.exit(1);
}

console.log(`🎉 All images loaded successfully!\n`);
console.log(`Next steps:`);
console.log(`  1. Verify images: ${runtime} images`);
console.log(`  2. Start services: yarn ${runtime}:dev\n`);
