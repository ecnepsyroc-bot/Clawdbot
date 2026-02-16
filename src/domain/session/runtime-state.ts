/**
 * In-memory store for session runtime state.
 *
 * This state resets on process restart - it represents transient "what the
 * session is doing right now" state, not persistent configuration.
 *
 * Previously this was incorrectly stored in SessionEntry (persisted to disk),
 * which caused stale data bugs and bloated the session store.
 */

import type { SessionRuntimeState } from "./types.js";

// In-memory store keyed by sessionKey
const runtimeState = new Map<string, SessionRuntimeState>();

/**
 * Get runtime state for a session.
 * Returns empty object if no state exists (never returns undefined).
 */
export function getRuntimeState(sessionKey: string): SessionRuntimeState {
  return runtimeState.get(sessionKey) ?? {};
}

/**
 * Update runtime state for a session (partial update, merges with existing).
 */
export function updateRuntimeState(
  sessionKey: string,
  patch: Partial<SessionRuntimeState>,
): void {
  const existing = runtimeState.get(sessionKey) ?? {};
  runtimeState.set(sessionKey, { ...existing, ...patch });
}

/**
 * Set a specific field in runtime state.
 * Convenience wrapper for single-field updates.
 */
export function setRuntimeStateField<K extends keyof SessionRuntimeState>(
  sessionKey: string,
  field: K,
  value: SessionRuntimeState[K],
): void {
  const existing = runtimeState.get(sessionKey) ?? {};
  runtimeState.set(sessionKey, { ...existing, [field]: value });
}

/**
 * Clear runtime state for a session (e.g., on session reset).
 */
export function clearRuntimeState(sessionKey: string): void {
  runtimeState.delete(sessionKey);
}

/**
 * Check if a session has any runtime state.
 */
export function hasRuntimeState(sessionKey: string): boolean {
  return runtimeState.has(sessionKey);
}

/**
 * Get all session keys that have runtime state.
 * Useful for debugging and testing.
 */
export function getRuntimeStateKeys(): string[] {
  return Array.from(runtimeState.keys());
}

/**
 * Clear all runtime state (for testing only).
 */
export function clearAllRuntimeStateForTest(): void {
  runtimeState.clear();
}
