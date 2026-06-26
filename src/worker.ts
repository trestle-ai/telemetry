/**
 * Telemetry Worker
 *
 * Background worker that periodically flushes queued telemetry batches
 * to the cloud API. Handles retries and error recovery.
 *
 * @packageDocumentation
 */

import type { TelemetryConfig, RunLogBatch } from './types.js';
import { TelemetryQueue } from './queue.js';

/**
 * Telemetry Worker
 *
 * Runs in the background and periodically flushes batches from the queue
 * to the telemetry API. Never throws errors - all failures are logged
 * to console.warn().
 *
 * @example
 * ```typescript
 * const worker = new TelemetryWorker({
 *   apiKey: 'rp_...',
 *   endpoint: 'https://api.trestle.com/v1/telemetry/logs',
 *   flushInterval: 5000,
 *   batchSize: 10
 * });
 *
 * worker.start();
 *
 * // Later...
 * worker.stop();
 * ```
 */
export class TelemetryWorker {
  private config: Required<TelemetryConfig>;
  private queue: TelemetryQueue;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Creates a new TelemetryWorker.
   *
   * @param config - Telemetry configuration
   * @param queue - Optional queue instance (for testing)
   */
  constructor(config: TelemetryConfig, queue?: TelemetryQueue) {
    // Set defaults
    this.config = {
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      batchSize: config.batchSize ?? 10,
      flushInterval: config.flushInterval ?? 5000,
      enabled: config.enabled ?? true,
      maxRetries: config.maxRetries ?? 3,
    };

    this.queue = queue ?? new TelemetryQueue();
  }

  /**
   * Starts the background worker.
   * Sets up a periodic flush interval.
   *
   * @example
   * ```typescript
   * worker.start();
   * console.log('Telemetry worker started');
   * ```
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[Telemetry] Worker already running');
      return;
    }

    if (!this.config.enabled) {
      console.warn('[Telemetry] Worker disabled via config');
      return;
    }

    this.isRunning = true;

    // Set up periodic flush
    this.intervalId = setInterval(() => {
      this.flush().catch((error) => {
        // Never throw - just log errors
        console.warn('[Telemetry] Flush error:', error);
      });
    }, this.config.flushInterval);

    console.log(`[Telemetry] Worker started (flush every ${this.config.flushInterval}ms)`);
  }

  /**
   * Stops the background worker.
   * Performs a final flush before stopping.
   *
   * @example
   * ```typescript
   * worker.stop();
   * console.log('Telemetry worker stopped');
   * ```
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Final flush (don't await, just try)
    this.flush().catch((error) => {
      console.warn('[Telemetry] Final flush error:', error);
    });

    console.log('[Telemetry] Worker stopped');
  }

  /**
   * Enqueues a batch for upload.
   *
   * @param batch - Batch to enqueue
   *
   * @example
   * ```typescript
   * worker.enqueue({
   *   schemaVersion: '1.0',
   *   runs: [runLog]
   * });
   * ```
   */
  enqueue(batch: RunLogBatch): void {
    this.queue.enqueue(batch);
  }

  /**
   * Gets the current queue size.
   * Useful for monitoring and debugging.
   *
   * @returns Number of batches in queue
   */
  getQueueSize(): number {
    return this.queue.size();
  }

  /**
   * Flushes all queued batches to the API.
   * Retries failed uploads according to config.
   *
   * @private
   */
  private async flush(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Process all batches in queue
    while (this.queue.size() > 0) {
      const batch = this.queue.dequeue();
      if (!batch) {
        break;
      }

      await this.uploadBatch(batch);
    }
  }

  /**
   * Uploads a single batch to the API with retry logic.
   *
   * @param batch - Batch to upload
   * @private
   */
  private async uploadBatch(batch: RunLogBatch): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        await this.sendToAPI(batch);
        // Success - exit retry loop
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Log retry attempt
        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(
            `[Telemetry] Upload failed (attempt ${attempt + 1}/${this.config.maxRetries}), ` +
              `retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    console.warn(
      `[Telemetry] Failed to upload batch after ${this.config.maxRetries} attempts:`,
      lastError
    );
  }

  /**
   * Sends a batch to the telemetry API.
   *
   * @param batch - Batch to send
   * @returns Promise that resolves on success
   * @private
   */
  private async sendToAPI(batch: RunLogBatch): Promise<void> {
    // For MVP, we use fetch API (available in Node.js 18+)
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      throw new Error(
        `Telemetry API returned ${response.status}: ${response.statusText}`
      );
    }
  }

  /**
   * Sleeps for a specified duration.
   *
   * @param ms - Duration in milliseconds
   * @returns Promise that resolves after the duration
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
