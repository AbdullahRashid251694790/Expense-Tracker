/**
 * SyncManager
 * Manages offline mutation queue for syncing when back online
 * Uses cross-platform storage for Android compatibility
 */

import { Storage } from '@/lib/storage/storage';

export interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data?: unknown;
  resourceId?: string;
  timestamp: number;
  retryCount: number;
}

export class SyncManager {
  private queueKey = 'mutation-queue';
  private maxRetries = 3;

  /**
   * Add a mutation to the queue
   */
  queueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): void {
    const queue = this.getQueue();
    queue.push({
      ...mutation,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    });
    this.saveQueue(queue);
  }

  /**
   * Get all queued mutations
   */
  getQueue(): QueuedMutation[] {
    const stored = Storage.getItemSync(this.queueKey);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Process the queue, executing mutations in order
   */
  async processQueue(
    executeMutation: (mutation: QueuedMutation) => Promise<void>
  ): Promise<{ successful: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) {
      return { successful: 0, failed: 0 };
    }

    const failed: QueuedMutation[] = [];
    let successful = 0;

    for (const mutation of queue) {
      try {
        await executeMutation(mutation);
        successful++;
      } catch (error) {
        // Increment retry count
        mutation.retryCount++;

        // Only keep if under max retries
        if (mutation.retryCount < this.maxRetries) {
          failed.push(mutation);
        } else {
          console.error(`Mutation ${mutation.id} failed after ${this.maxRetries} retries`, error);
        }
      }
    }

    this.saveQueue(failed);
    return { successful, failed: failed.length };
  }

  /**
   * Remove a specific mutation from the queue
   */
  removeMutation(id: string): void {
    const queue = this.getQueue().filter((m) => m.id !== id);
    this.saveQueue(queue);
  }

  /**
   * Check if there are pending mutations
   */
  hasPendingMutations(): boolean {
    return this.getQueue().length > 0;
  }

  /**
   * Get pending mutation count
   */
  getPendingCount(): number {
    return this.getQueue().length;
  }

  /**
   * Clear all pending mutations
   */
  clearQueue(): void {
    Storage.removeItemSync(this.queueKey);
  }

  private saveQueue(queue: QueuedMutation[]): void {
    Storage.setItemSync(this.queueKey, JSON.stringify(queue));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
