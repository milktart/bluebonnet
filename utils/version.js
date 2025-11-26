const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Get application version and build information
 * @returns {Object} Version information including app version, git commit, and build timestamp
 *
 * Priority for git commit:
 * 1. GIT_COMMIT environment variable (set by Docker/CI build)
 * 2. .build-info file (created during docker build)
 * 3. git rev-parse command (works in development)
 * 4. 'unknown' (fallback if nothing else available)
 */
function getVersionInfo() {
  // Get version from package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  let appVersion = 'unknown';

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    appVersion = packageJson.version || 'unknown';
  } catch (error) {
    // If package.json can't be read, keep default 'unknown'
  }

  // Get git commit hash with multiple fallback strategies
  let gitCommit = process.env.GIT_COMMIT || 'unknown';

  // If not set via environment, try reading from .build-info file
  if (gitCommit === 'unknown') {
    try {
      const buildInfoPath = path.join(__dirname, '..', '.build-info');
      if (fs.existsSync(buildInfoPath)) {
        const buildInfo = fs.readFileSync(buildInfoPath, 'utf8');
        const commitMatch = buildInfo.match(/GIT_COMMIT=(.+)/);
        if (commitMatch && commitMatch[1]) {
          gitCommit = commitMatch[1].trim();
        }
      }
    } catch (error) {
      // Continue to next fallback
    }
  }

  // If still not found, try git command (works in development)
  if (gitCommit === 'unknown') {
    try {
      gitCommit = execSync('git rev-parse --short HEAD', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
      }).trim();
    } catch (error) {
      // If git command fails (not in a git repo or git not available), keep default 'unknown'
    }
  }

  // Get build timestamp
  // Priority: ENV variable > .build-info file > current time
  let buildTimestamp = process.env.BUILD_TIMESTAMP || 'unknown';

  if (buildTimestamp === 'unknown') {
    try {
      const buildInfoPath = path.join(__dirname, '..', '.build-info');
      if (fs.existsSync(buildInfoPath)) {
        const buildInfo = fs.readFileSync(buildInfoPath, 'utf8');
        const timestampMatch = buildInfo.match(/BUILD_TIMESTAMP=(.+)/);
        if (timestampMatch && timestampMatch[1]) {
          buildTimestamp = timestampMatch[1].trim();
        }
      }
    } catch (error) {
      // Use current time as fallback
    }
  }

  if (buildTimestamp === 'unknown') {
    buildTimestamp = new Date().toISOString();
  }

  return {
    appVersion,
    gitCommit,
    buildTimestamp,
    nodeVersion: process.version,
    platform: process.platform,
  };
}

// Cache version info on module load (won't change during process lifetime)
const versionInfo = getVersionInfo();

module.exports = versionInfo;
