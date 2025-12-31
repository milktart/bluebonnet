/**
 * SvelteKit Router Adapter
 * Provides navigation functions for SvelteKit application
 * SvelteKit handles routing natively via file-based routing
 */

/**
 * Navigate to a route
 * Uses browser navigation for SvelteKit
 */
export function navigateTo(
  path: string | '/' | 'dashboard' | 'login' | 'register'
): void {
  // Map friendly names to actual paths
  const pathMap: Record<string, string> = {
    '/': '/',
    'home': '/',
    'dashboard': '/dashboard',
    'login': '/login',
    'register': '/register',
  };

  const actualPath = pathMap[path as string] || String(path);
  window.location.href = actualPath;
}

/**
 * Initialize router (SvelteKit handles this automatically)
 * This is a no-op since SvelteKit handles routing natively
 */
export function initRouter(): void {
  // SvelteKit handles routing natively - nothing to initialize
}
