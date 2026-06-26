import { describe, expect, it } from 'vitest';

import { TelemetryQueue } from '../src/queue.js';
import type { RunLogBatch } from '../src/types.js';

function makeBatch(id: string): RunLogBatch {
  return {
    schemaVersion: '1.0',
    logs: [
      {
        runId: id,
        workflowName: 'test-workflow',
        status: 'success',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:00:01.000Z',
        steps: [],
      },
    ],
  };
}

describe('TelemetryQueue', () => {
  it('dequeues batches in FIFO order', () => {
    const queue = new TelemetryQueue();
    const first = makeBatch('run-1');
    const second = makeBatch('run-2');

    queue.enqueue(first);
    queue.enqueue(second);

    expect(queue.dequeue()).toBe(first);
    expect(queue.dequeue()).toBe(second);
    expect(queue.dequeue()).toBeUndefined();
  });

  it('tracks size and clears queued batches', () => {
    const queue = new TelemetryQueue();

    expect(queue.size()).toBe(0);

    queue.enqueue(makeBatch('run-1'));
    queue.enqueue(makeBatch('run-2'));
    expect(queue.size()).toBe(2);

    queue.clear();
    expect(queue.size()).toBe(0);
    expect(queue.dequeue()).toBeUndefined();
  });

  it('peekAll returns a snapshot without dequeuing', () => {
    const queue = new TelemetryQueue();
    const batch = makeBatch('run-1');

    queue.enqueue(batch);

    const snapshot = queue.peekAll();
    expect(snapshot).toEqual([batch]);
    expect(snapshot).not.toBe(queue.peekAll());
    expect(queue.size()).toBe(1);
    expect(queue.dequeue()).toBe(batch);
  });
});
