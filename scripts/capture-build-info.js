#!/usr/bin/env node

/**
 * Capture build information (git commit, build timestamp, etc.)
 * This script is run during Docker build to capture the git commit hash
 * and save it as an environment variable or file for the application to use.
 *
 * Usage:
 *   node scripts/capture-build-info.js
 *
 * Outputs:
 *   - GIT_COMMIT environment variable (for Docker)
 *   - BUILD_TIMESTAMP environment variable (for Docker)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function captureGitInfo() {
  try {
    // Get short commit hash
    const gitCommit = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    return gitCommit;
  } catch (error) {
    console.warn('Warning: Could not capture git commit hash');
    return 'unknown';
  }
}

function captureRefInfo() {
  try {
    // Get branch name
    const gitRef = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    return gitRef;
  } catch (error) {
    return 'unknown';
  }
}

// Capture build information
const gitCommit = captureGitInfo();
const gitRef = captureRefInfo();
const buildTimestamp = new Date().toISOString();

// Output for Docker build
console.log(`GIT_COMMIT=${gitCommit}`);
console.log(`GIT_REF=${gitRef}`);
console.log(`BUILD_TIMESTAMP=${buildTimestamp}`);

// Optionally write to a file for reference
const buildInfoPath = path.join(__dirname, '..', '.build-info');
try {
  fs.writeFileSync(
    buildInfoPath,
    `GIT_COMMIT=${gitCommit}\nGIT_REF=${gitRef}\nBUILD_TIMESTAMP=${buildTimestamp}\n`
  );
} catch (error) {
  console.warn('Warning: Could not write build info file');
}

process.exit(0);
