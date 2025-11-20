# Build Process Documentation

This document explains the JavaScript build process using esbuild for code bundling, minification, and optimization.

## Overview

The application uses **esbuild** to bundle, minify, and optimize JavaScript files. This provides:

- **40-60% smaller bundle sizes** through minification
- **Code splitting** for faster initial page loads
- **Content-based hashing** for optimal caching
- **Source maps** for debugging production code
- **Lightning-fast builds** (~100ms)

## Build System

### Technologies

- **esbuild** - Ultra-fast JavaScript bundler
- **ES6 modules** - Modern import/export syntax
- **Code splitting** - Separate bundles for different pages

### Bundle Structure

```
public/dist/
├── common-[hash].js        # Shared utilities (datetime, main, notifications)
├── dashboard-[hash].js     # Dashboard-specific code
├── trip-view-[hash].js     # Trip view page (includes Preline UI)
├── map-view-[hash].js      # Standalone map view
├── chunks/                 # Auto-generated shared chunks
└── manifest.json           # Maps bundle names to hashed filenames
```

## Build Commands

### Development Build (Fast, unminified)

```bash
npm run build-js
```

- Bundles code without minification
- Includes source maps for debugging
- Fast iteration during development

### Production Build (Optimized, minified)

```bash
npm run build:prod
```

- Minifies JavaScript (~40-60% size reduction)
- Optimizes for production deployment
- Includes source maps

### Watch Mode (Auto-rebuild on changes)

```bash
npm run build-js:watch
```

- Watches for file changes
- Automatically rebuilds on save
- Great for development workflow

### Full Build (CSS + JS)

```bash
npm run build
```

- Builds both CSS (Tailwind) and JavaScript
- Production-ready output

## Entry Points

Entry points define which code gets bundled for each page:

### `public/js/entries/common.js`

Shared across all pages:

- datetime-formatter.js
- time-input-formatter.js
- main.js
- notifications.js

**Pages using this:** All pages

### `public/js/entries/dashboard.js`

Dashboard-specific:

- maps.js
- trip-view-utils.js
- sidebar-loader.js
- companions.js
- voucher-sidebar-manager.js
- trips-list.js

**Pages using this:** Dashboard (`/`)

### `public/js/entries/trip-view.js`

Individual trip view:

- maps.js
- trip-view-utils.js
- preline.js (380KB - UI framework)
- trip-view-sidebar.js
- sidebar-loader.js
- async-form-handler.js
- companions.js
- voucher-sidebar-manager.js

**Pages using this:** Trip detail (`/trips/:id`)

### `public/js/entries/map-view.js`

Standalone map view:

- maps.js

**Pages using this:** Map page (`/trips/:id/map`)

## How It Works

### 1. Configuration (`esbuild.config.js`)

```javascript
{
  bundle: true,              // Combine multiple files
  minify: true,              // Minify in production
  sourcemap: true,           // Generate source maps
  splitting: true,           // Enable code splitting
  format: 'esm',             // ES modules output
  entryNames: '[name]-[hash]' // Content-based hashing
}
```

### 2. Build Process

1. esbuild reads entry points
2. Analyzes dependencies and imports
3. Bundles related code together
4. Splits common code into shared chunks
5. Minifies code (production mode)
6. Generates content hashes
7. Creates manifest.json mapping

### 3. Server Integration (`server.js`)

```javascript
// Load manifest on server start
bundleManifest = JSON.parse(fs.readFileSync('public/dist/manifest.json'));

// Helper function for templates
function getBundle(name) {
  return bundleManifest[name] || `/js/entries/${name}.js`;
}

// Available in all EJS templates
res.locals.getBundle = getBundle;
```

### 4. Template Usage

```html
<!-- Load bundled scripts with content hashes -->
<script type="module" src="<%= getBundle('common') %>"></script>
<script type="module" src="<%= getBundle('dashboard') %>"></script>
```

## Benefits

### Before esbuild

```
Total JavaScript: 568KB
- Custom code: 188KB (unminified)
- Preline UI: 380KB
- 10+ separate HTTP requests
- No code splitting
- Cache busting via query params
```

### After esbuild

```
Total JavaScript: ~350KB (development) / ~220KB (production minified)
- Common bundle: 24KB
- Dashboard bundle: 10KB
- Trip view bundle: 516KB (includes Preline)
- Map view bundle: 0.3KB
- 3-4 HTTP requests (with shared chunks)
- Smart code splitting
- Content-hash based caching
```

### Production (minified) Estimates

```
- Common: ~8-10KB minified
- Dashboard: ~4-5KB minified
- Trip view: ~150-200KB minified (Preline is the bulk)
- Map view: ~0.2KB minified

Total: ~165-215KB minified (vs 568KB unminified)
Savings: ~60-70% reduction
```

## Deployment

### Pre-deployment Checklist

1. Run production build:

   ```bash
   npm run build:prod
   ```

2. Verify bundles exist:

   ```bash
   ls -lh public/dist/*.js
   ```

3. Check manifest.json:

   ```bash
   cat public/dist/manifest.json
   ```

4. Commit manifest and configuration (not bundles):

   ```bash
   git add public/dist/manifest.json
   git add esbuild.config.js
   git add public/js/entries/
   git commit -m "Update bundle manifest"
   ```

5. Deploy and rebuild on server:
   ```bash
   npm run build:prod
   npm start
   ```

### CI/CD Integration

Add to your deployment pipeline:

```yaml
# Example for GitHub Actions
- name: Build assets
  run: |
    npm install
    npm run build:prod

- name: Deploy
  run: |
    # Your deployment commands
```

## Troubleshooting

### Build Fails

```bash
# Check for syntax errors
npm run build-js

# View detailed errors
node esbuild.config.js
```

### Bundles Not Loading

1. Check server console for manifest loading:

   ```
   ✅ Loaded bundle manifest: common, dashboard, trip-view, map-view
   ```

2. Verify manifest.json exists:

   ```bash
   cat public/dist/manifest.json
   ```

3. Rebuild if manifest is missing:
   ```bash
   npm run build-js
   ```

### Source Maps Not Working

1. Ensure `sourcemap: true` in esbuild.config.js
2. Check browser DevTools settings (enable source maps)
3. Verify `.map` files exist in `public/dist/`

## Future Optimizations

### Planned Improvements

1. **Tree-shaking Preline** - Only include used components (~200KB savings)
2. **Dynamic imports** - Lazy load heavy features (~50-100KB initial load reduction)
3. **Brotli compression** - Additional 20-30% compression over gzip
4. **CDN deployment** - Serve bundles from CDN with long cache times

### Optional Enhancements

- TypeScript compilation
- CSS bundling integration
- Image optimization pipeline
- Service Worker precaching

## Performance Monitoring

Track bundle sizes over time:

```bash
# Check current bundle sizes
npm run build-js

# Compare with previous builds
git diff HEAD~1 public/dist/manifest.json
```

## Additional Resources

- [esbuild documentation](https://esbuild.github.io/)
- [ES Modules guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Code splitting best practices](https://web.dev/code-splitting/)
