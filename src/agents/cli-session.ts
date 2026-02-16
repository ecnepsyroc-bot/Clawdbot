import { getRuntimeState, updateRuntimeState } from "../domain/session/index.js";
import { normalizeProviderId } from "./model-selection.js";

/**
 * Get CLI session ID from runtime state.
 * CLI session IDs are runtime state that should not persist to disk.
 */
export function getCliSessionId(
  sessionKey: string | undefined,
  provider: string,
): string | undefined {
  if (!sessionKey) return undefined;
  const state = getRuntimeState(sessionKey);
  const normalized = normalizeProviderId(provider);
  const fromMap = state.cliSessionIds?.[normalized];
  if (fromMap?.trim()) return fromMap.trim();
  if (normalized === "claude-cli") {
    const legacy = state.claudeCliSessionId?.trim();
    if (legacy) return legacy;
  }
  return undefined;
}

/**
 * Set CLI session ID in runtime state.
 * CLI session IDs are runtime state that should not persist to disk.
 */
export function setCliSessionId(sessionKey: string, provider: string, sessionId: string): void {
  if (!sessionKey) return;
  const normalized = normalizeProviderId(provider);
  const trimmed = sessionId.trim();
  if (!trimmed) return;
  const state = getRuntimeState(sessionKey);
  const existing = state.cliSessionIds ?? {};
  const cliSessionIds = { ...existing, [normalized]: trimmed };
  const patch: { cliSessionIds: Record<string, string>; claudeCliSessionId?: string } = {
    cliSessionIds,
  };
  if (normalized === "claude-cli") {
    patch.claudeCliSessionId = trimmed;
  }
  updateRuntimeState(sessionKey, patch);
}
