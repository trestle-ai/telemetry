/**
 * Telemetry Type Definitions
 *
 * Defines types for telemetry data structures used in the queue, worker,
 * and API communication.
 *
 * @packageDocumentation
 */

/**
 * Step log entry in a telemetry batch.
 * Matches the API telemetry endpoint format.
 */
export interface TelemetryStepLog {
  stepName: string;
  status: 'success' | 'failed';
  startedAt: string;
  completedAt: string;
  errorType?: string;
  errorMessage?: string;
  model?: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Single workflow run in a telemetry batch.
 */
export interface TelemetryRun {
  runId: string;
  workflowName: string;
  status: 'success' | 'failed';
  startedAt: string;
  completedAt: string;
  errorType?: string;
  errorMessage?: string;
  steps: TelemetryStepLog[];
}

/**
 * Batch of events sent to the unified POST /v1/telemetry endpoint.
 */
export interface RunLogBatch {
  schemaVersion: string;
  events: Record<string, unknown>[];
}

/**
 * Configuration for the telemetry system.
 *
 * @example
 * ```typescript
 * const config: TelemetryConfig = {
 *   apiKey: 'rp_...',
 *   endpoint: 'https://api.trestle.com/v1/telemetry/logs',
 *   batchSize: 10,
 *   flushInterval: 5000,
 *   enabled: true
 * };
 * ```
 */
export interface TelemetryConfig {
  /**
   * API key for authentication.
   */
  apiKey: string;

  /**
   * Telemetry endpoint URL.
   */
  endpoint: string;

  /**
   * Number of runs to batch before flushing.
   * Default: 10
   */
  batchSize?: number;

  /**
   * Time interval in milliseconds between flushes.
   * Default: 5000 (5 seconds)
   */
  flushInterval?: number;

  /**
   * Whether telemetry is enabled.
   * Default: true
   */
  enabled?: boolean;

  /**
   * Maximum number of retry attempts for failed uploads.
   * Default: 3
   */
  maxRetries?: number;
}
