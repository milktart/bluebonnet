import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.location
Object.defineProperty(global, 'location', {
  value: {
    href: 'http://localhost',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn()
  },
  writable: true
});

// Mock fetch globally
global.fetch = vi.fn();

// Extend expect matchers if needed
declare module 'vitest' {
  interface Assertion<T> {
    // Custom matchers can be added here
  }
}
