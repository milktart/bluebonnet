import { render } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';

/**
 * Render a Svelte component with testing utilities
 * @param component Svelte component
 * @param props Component props
 * @returns Testing utilities
 */
export function renderComponent<T extends Record<string, any>>(
  component: any,
  props?: T
) {
  return render(component, { props });
}

/**
 * Wait for a condition to be true
 * @param condition Function that returns boolean
 * @param timeout Maximum time to wait in ms
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Create a mock API response
 * @param data Response data
 * @param status HTTP status code
 */
export function createMockResponse<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
}

/**
 * Mock fetch for tests
 */
export const mockFetch = (response: any) => {
  return vi.fn().mockResolvedValueOnce(response);
};

import { vi } from 'vitest';
