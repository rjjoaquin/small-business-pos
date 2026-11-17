const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

type State = { failures: number[]; lockedUntil: number };

const state: State = { failures: [], lockedUntil: 0 };

export function loginAllowed(now = Date.now()): boolean {
  return now >= state.lockedUntil;
}

export function recordFailure(now = Date.now()): void {
  state.failures = state.failures.filter((time) => now - time < WINDOW_MS);
  state.failures.push(now);
  if (state.failures.length >= MAX_FAILURES) {
    state.lockedUntil = now + WINDOW_MS;
    state.failures = [];
  }
}

export function recordSuccess(): void {
  state.failures = [];
  state.lockedUntil = 0;
}

export function resetLoginLimit(): void {
  state.failures = [];
  state.lockedUntil = 0;
}
