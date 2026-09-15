import * as Sentry from "@sentry/node";

// Sentry configuration from environment variables
const dsn = process.env.SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT || "development";
const tracesSampleRate = Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "1.0");

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Call this at the very beginning of your application, before any other imports
 */
export function initSentry(): void {
  if (!dsn || process.env.NODE_ENV === "test") {
    return;
  }

  Sentry.init({
    dsn,
    environment,
    // Performance Monitoring
    tracesSampleRate,
  });

  console.log(`[Sentry] Initialized for ${environment}`);
}

/**
 * Gracefully close Sentry
 * Call this before your application exits to ensure all events are flushed
 *
 * @example
 * process.on('SIGTERM', async () => {
 *   await closeSentry();
 *   process.exit(0);
 * });
 */
export async function closeSentry(): Promise<void> {
  try {
    await Sentry.close(2000);
    console.log("[Sentry] Closed successfully");
  } catch (error) {
    console.error("[Sentry] Error closing:", error);
  }
}

/**
 * Capture an exception with Sentry
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error);
 * }
 */
export function captureException(error: Error | unknown): string {
  return Sentry.captureException(error);
}

/**
 * Capture a message with Sentry
 *
 * @example
 * captureMessage("User completed checkout", "info");
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info"): string {
  return Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry
 *
 * @example
 * setUser({ id: "123", email: "user@example.com" });
 */
export function setUser(user: Sentry.User | null): void {
  Sentry.setUser(user);
}

/**
 * Add a breadcrumb for debugging context
 *
 * @example
 * addBreadcrumb({
 *   category: "auth",
 *   message: "User logged in",
 *   level: "info",
 * });
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Create a span for performance monitoring
 *
 * @example
 * const result = await withSpan(
 *   { name: "database-query", op: "db.query" },
 *   async () => {
 *     return await db.query("SELECT * FROM users");
 *   }
 * );
 */
export async function withSpan<T>(
  context: Parameters<typeof Sentry.startSpan>[0],
  callback: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan(context, callback);
}

// Re-export Sentry for advanced usage
export { Sentry };

/**
 * Environment Variables:
 *
 * SENTRY_DSN - Your Sentry DSN from the project settings (required)
 * SENTRY_ENVIRONMENT - Environment name (default: development)
 * SENTRY_TRACES_SAMPLE_RATE - Sample rate for performance monitoring 0.0-1.0 (default: 1.0)
 * SENTRY_PROFILES_SAMPLE_RATE - Sample rate for profiling 0.0-1.0 (default: 0.1)
 *
 * Getting started:
 * 1. Create a project at https://sentry.io
 * 2. Copy your DSN from Project Settings > Client Keys
 * 3. Set SENTRY_DSN in your .env file
 *
 * Production recommendations:
 * - Set SENTRY_TRACES_SAMPLE_RATE to 0.1-0.2 to reduce costs
 * - Set SENTRY_PROFILES_SAMPLE_RATE to 0.1 or lower
 * - Configure release tracking with SENTRY_RELEASE env var
 */
