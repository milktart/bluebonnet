import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 5173,
		fs: {
			strict: false
		}
	},
	optimizeDeps: {
		disabled: true
	},
	resolve: {
		alias: {
			$lib: '/app/src/lib',
			$components: '/app/src/lib/components'
		}
	}
})
