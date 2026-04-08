import { setupWorker } from 'msw/browser';
import { handlers, resetMockAuth } from './msw-handlers';

// Export the worker setup
export const worker = setupWorker(...handlers);

// Export reset function for test cleanup
export { resetMockAuth };

/**
 * Starts the MSW worker for browser mocking
 * Call this in a beforeAll or setup hook
 */
export async function startWorker() {
  await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    quiet: true, // Suppress console messages
  });
}

/**
 * Stops the MSW worker
 * Call this in an afterAll or teardown hook
 */
export function stopWorker() {
  worker.stop();
}

/**
 * Resets auth state between tests
 */
export function resetAuth() {
  resetMockAuth();
}