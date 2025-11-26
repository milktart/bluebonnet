const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Get application version and build information
 * @returns {Object} Version information including app version, git commit, and build timestamp
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

  // Get git commit hash
  // Priority: ENV variable > git command > unknown
  let gitCommit = process.env.GIT_COMMIT || 'unknown';

  if (gitCommit === 'unknown') {
    try {
      gitCommit = execSync('git rev-parse --short HEAD', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
      }).trim();
    } catch (error) {
      // If git command fails (not in a git repo or git not available), keep default 'unknown'
    }
  }

  // Get build timestamp (when this Node.js process started)
  const buildTimestamp = process.env.BUILD_TIMESTAMP || new Date().toISOString();

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
