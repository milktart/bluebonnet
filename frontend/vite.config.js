import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: '0.0.0.0',
    fs: {
      strict: false,
    },
    middlewareMode: false,
    // Disable HMR for now - HTTPS with self-signed certs makes wss:// unreliable
    // Can be re-enabled with proper SSL certificates
    hmr: false,
    allowedHosts: ['bluebonnet-dev.milkt.art', 'localhost', '127.0.0.1'],
    // Proxy API requests to Express backend running on port 3000 (internal)
    // IMPORTANT: changeOrigin true + ws true allows cookies and WebSocket upgrades
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Ensure cookies are passed through
            if (proxyRes.headers['set-cookie']) {
              res.setHeader('set-cookie', proxyRes.headers['set-cookie']);
            }
          });
        },
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Ensure cookies are passed through
            if (proxyRes.headers['set-cookie']) {
              res.setHeader('set-cookie', proxyRes.headers['set-cookie']);
            }
          });
        },
      },
      '/trips': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/flights': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/hotels': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/events': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/car-rentals': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/transportation': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/vouchers': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/companions': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/account': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  optimizeDeps: {
    // Include common dependencies that need pre-bundling
    include: ['leaflet'],
  },
  resolve: {
    alias: {
      $lib: '/app/src/lib',
      $components: '/app/src/lib/components',
    },
  },
});
