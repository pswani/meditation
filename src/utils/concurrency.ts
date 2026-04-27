export type ConcurrencySlotRelease = () => void;

export interface ConcurrencyLimiter {
  // Returns a release function synchronously if a slot is available, otherwise null.
  // Use this to avoid a microtask hop when a slot is immediately free.
  tryAcquire(): ConcurrencySlotRelease | null;
  // Waits for a slot when none is immediately available.
  acquire(): Promise<ConcurrencySlotRelease>;
}

export function createConcurrencyLimiter(maxConcurrent: number): ConcurrencyLimiter {
  let running = 0;
  const queue: Array<() => void> = [];

  function release(): void {
    running--;
    if (queue.length > 0) {
      const next = queue.shift()!;
      next();
    }
  }

  return {
    tryAcquire(): ConcurrencySlotRelease | null {
      if (running < maxConcurrent) {
        running++;
        return release;
      }
      return null;
    },
    acquire(): Promise<ConcurrencySlotRelease> {
      return new Promise((resolve) => {
        if (running < maxConcurrent) {
          running++;
          resolve(release);
        } else {
          queue.push(() => {
            running++;
            resolve(release);
          });
        }
      });
    },
  };
}
