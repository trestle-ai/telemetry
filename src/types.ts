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
  /**
   * Name of the step.
   */
  stepName: string;

  /**
   * Status of the step execution.
   */
  status: 'success' | 'failed';

  /**
   * ISO 8601 timestamp when step started.
   */
  startedAt: string;

  /**
   * ISO 8601 timestamp when step completed.
   */
  completedAt: string;

  /**
   * Step output (if successful).
   */
  output?: any;

  /**
   * Error type (if failed).
   */
  errorType?: string;

  /**
   * Error message (if failed).
   */
  errorMessage?: string;

  /**
   * Model ID used for this step.
   * Examples: 'claude-sonnet-4-5', 'gpt-4.1'
   */
  model?: string;

  /**
   * Token usage for this step.
   */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Single workflow run in a telemetry batch.
 * Represents a complete workflow execution with all step logs.
 */
export interface TelemetryRun {
  /**
   * Unique identifier for this run.
   */
  runId: string;

  /**
   * Name of the workflow.
   */
  workflowName: string;

  /**
   * Status of the workflow execution.
   */
  status: 'success' | 'failed';

  /**
   * ISO 8601 timestamp when run started.
   */
  startedAt: string;

  /**
   * ISO 8601 timestamp when run completed.
   */
  completedAt: string;

  /**
   * Error type (if failed).
   */
  errorType?: string;

  /**
   * Error message (if failed).
   */
  errorMessage?: string;

  /**
   * All step execution logs.
   */
  steps: TelemetryStepLog[];
}

/**
 * Batch of run logs sent to the telemetry API.
 * The SDK queues and sends these in batches.
 *
 * @example
 * ```typescript
 * const batch: RunLogBatch = {
 *   schemaVersion: '1.0',
 *   logs: [runLog1, runLog2]
 * };
 * ```
 */
export interface RunLogBatch {
  /**
   * Schema version for backward compatibility.
   */
  schemaVersion: string;

  /**
   * Array of workflow run logs.
   */
  logs: TelemetryRun[];
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
