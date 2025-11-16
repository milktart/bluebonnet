const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Build configuration
const config = {
  entryPoints: {
    // Common bundle - shared across all pages
    'common': './public/js/entries/common.js',
    // Page-specific bundles
    'dashboard': './public/js/entries/dashboard.js',
    'trip-view': './public/js/entries/trip-view.js',
    'map-view': './public/js/entries/map-view.js',
  },
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  splitting: true,
  format: 'esm',
  outdir: 'public/dist',
  entryNames: '[name]-[hash]',
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  metafile: true,
  platform: 'browser',
  target: ['es2020'],
  logLevel: 'info',
};

// Build function
async function build() {
  try {
    console.log('🚀 Building JavaScript bundles...');

    const result = await esbuild.build(config);

    // Generate manifest.json for asset mapping
    const manifest = {};

    if (result.metafile) {
      const outputs = result.metafile.outputs;

      for (const [outputPath, info] of Object.entries(outputs)) {
        if (info.entryPoint) {
          // Extract entry name from entry point path
          const entryName = path.basename(info.entryPoint, '.js');
          // Remove 'public/' prefix since Express serves from public folder
          const publicPath = '/' + outputPath.replace(/^public\//, '');

          manifest[entryName] = publicPath;
        }
      }

      // Write manifest to public directory
      fs.writeFileSync(
        path.join(__dirname, 'public/dist/manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      console.log('✅ Build complete!');
      console.log('📦 Bundle sizes:');

      for (const [name, bundlePath] of Object.entries(manifest)) {
        // Convert web path to filesystem path
        const fsPath = path.join(__dirname, 'public', bundlePath);
        const stats = fs.statSync(fsPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   ${name}: ${sizeKB} KB`);
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Watch mode
async function watch() {
  const ctx = await esbuild.context(config);

  console.log('👀 Watching for changes...');
  await ctx.watch();

  // Rebuild manifest on changes
  const chokidar = require('chokidar');
  const watcher = chokidar.watch('./public/js/entries/**/*.js');

  watcher.on('change', async () => {
    await build();
  });
}

// Run build or watch based on args
const args = process.argv.slice(2);
if (args.includes('--watch')) {
  watch();
} else {
  build();
}
