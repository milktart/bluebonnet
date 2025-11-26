# Build Version Information

This document explains how build version information is captured and displayed in the application.

## Problem

In production Docker builds, the `.git` directory is excluded from the Docker build context (via `.dockerignore`), which means the application cannot determine the git commit hash when running `git rev-parse --short HEAD`.

## Solution

The build process now captures git information **at build time** and stores it in a `.build-info` file. This file is then included in the Docker image and read by the application at runtime.

### How It Works

1. **Capture Phase** (`scripts/capture-build-info.js`)
   - Runs during the Docker build process
   - Executes `git rev-parse --short HEAD` to get the commit hash
   - Gets the branch name via `git rev-parse --abbrev-ref HEAD`
   - Captures the build timestamp
   - Writes results to `.build-info` file

2. **Version Info Module** (`utils/version.js`)
   - Reads version info with this priority:
     1. Environment variable: `GIT_COMMIT` (for CI/CD overrides)
     2. `.build-info` file (created during Docker build)
     3. Git command (fallback for development environments)
     4. 'unknown' (final fallback if nothing else available)

3. **Display** (`views/account/settings.ejs`)
   - Shows version and build information at the bottom of account settings
   - Displays format: `Version X.X.X | Build <commit-hash>`

## Usage

### Local Development

Git information is captured automatically via `git rev-parse --short HEAD` command.

```bash
npm run dev
# Navigate to /account to see version info
```

### Docker Builds

Build info is automatically captured in the `builder` stage:

```bash
docker-compose up --build
# Version info is captured from the git repo and stored in .build-info
```

### CI/CD Pipelines

You can override the git commit by setting the `GIT_COMMIT` environment variable:

```bash
# Using environment variable (highest priority)
export GIT_COMMIT=my-custom-hash
docker-compose up --build

# Or in Dockerfile build args
docker build --build-arg NODE_ENV=production .
```

## Files Involved

- `scripts/capture-build-info.js` - Script that captures build information
- `.build-info` - Generated file containing build information (not tracked in git)
- `utils/version.js` - Module that reads and caches version information
- `views/account/settings.ejs` - Displays version information to users
- `controllers/accountController.js` - Passes versionInfo to template
- `Dockerfile` - Captures build info in builder stage and copies to production stages

## Testing

To test version info locally:

```bash
# Run the capture script
node scripts/capture-build-info.js

# Check the generated .build-info file
cat .build-info

# Test version module
node -e "const v = require('./utils/version'); console.log(v);"
```

## Deployment Checklist

When deploying to production:

1. Ensure git repository is available during Docker build
2. Run `docker-compose build` (or `docker-compose up --build`)
3. The `.build-info` file will be automatically created and included
4. Visit `/account` to verify version info displays correctly
5. No manual setup required - everything is automated

## Troubleshooting

### Version shows "unknown"

**Causes:**
- Git repository is not available during Docker build
- `.build-info` file was not created
- Node process running old cached version

**Solutions:**
1. Ensure git repository is available during build
2. Manually create `.build-info`:
   ```bash
   node scripts/capture-build-info.js > .build-info
   ```
3. Restart the application process

### Version info not updating

- The version info is cached at module load time
- Restart the server to reload `utils/version.js`
- When using Docker: rebuild the image with `docker-compose up --build`

## Migration Notes

If you're upgrading from the old version:

1. Pull latest code
2. Run `docker-compose down && docker-compose up --build`
3. The new build system will automatically capture git info
4. No manual migration steps required
