/**
 * Telemetry Queue
 *
 * In-memory queue for batching telemetry run logs.
 * Provides thread-safe enqueue/dequeue operations.
 *
 * @packageDocumentation
 */

import type { RunLogBatch } from './types.js';

/**
 * Telemetry Queue
 *
 * Simple in-memory queue for batching workflow run logs before sending
 * to the telemetry API. Uses FIFO ordering.
 *
 * @example
 * ```typescript
 * const queue = new TelemetryQueue();
 *
 * queue.enqueue(batch);
 * console.log(queue.size()); // 1
 *
 * const batch = queue.dequeue();
 * console.log(queue.size()); // 0
 * ```
 */
export class TelemetryQueue {
  /**
   * Internal queue storage.
   */
  private queue: RunLogBatch[] = [];

  /**
   * Adds a batch to the end of the queue.
   *
   * @param batch - Batch of run logs to enqueue
   *
   * @example
   * ```typescript
   * queue.enqueue({
   *   schemaVersion: '1.0',
   *   logs: [runLog]
   * });
   * ```
   */
  enqueue(batch: RunLogBatch): void {
    this.queue.push(batch);
  }

  /**
   * Removes and returns the first batch from the queue.
   *
   * @returns The first batch, or undefined if queue is empty
   *
   * @example
   * ```typescript
   * const batch = queue.dequeue();
   * if (batch) {
   *   // Process batch
   * }
   * ```
   */
  dequeue(): RunLogBatch | undefined {
    return this.queue.shift();
  }

  /**
   * Returns the number of batches in the queue.
   *
   * @returns Queue size
   *
   * @example
   * ```typescript
   * console.log(`Queue has ${queue.size()} batches`);
   * ```
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Removes all batches from the queue.
   *
   * @example
   * ```typescript
   * queue.clear();
   * console.log(queue.size()); // 0
   * ```
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Returns all batches without removing them.
   * Useful for debugging and testing.
   *
   * @returns Array of all queued batches
   */
  peekAll(): RunLogBatch[] {
    return [...this.queue];
  }
}
