/**
 * Session domain module.
 *
 * Clean bounded contexts extracted from the monolithic SessionEntry type.
 * This module provides:
 *
 * - ProtocolSession: Runtime protocol state (ACP layer)
 * - ExecutionConfig: Tool execution configuration (auto-reply layer)
 * - QueueConfig: Message queue behavior (auto-reply/queue layer)
 * - SessionRuntimeState: Transient state that shouldn't persist
 * - Session key utilities: Parsing, building, and normalization
 */

// Domain types
export type {
  ProtocolSession,
  ExecutionConfig,
  ExecHost,
  ExecSecurity,
  ExecAsk,
  QueueConfig,
  QueueMode,
  QueueDrop,
  SessionRuntimeState,
} from "./types.js";

// Re-export complex types from persistence layer
export type { SessionSkillSnapshot, SessionSystemPromptReport } from "./types.js";

// Runtime state store
export {
  getRuntimeState,
  updateRuntimeState,
  setRuntimeStateField,
  clearRuntimeState,
  hasRuntimeState,
  getRuntimeStateKeys,
  clearAllRuntimeStateForTest,
} from "./runtime-state.js";

// Session key utilities
export type { ParsedAgentSessionKey } from "./session-key.js";
export {
  // Constants
  DEFAULT_AGENT_ID,
  DEFAULT_MAIN_KEY,
  DEFAULT_ACCOUNT_ID,
  // Parsing
  parseAgentSessionKey,
  isSubagentSessionKey,
  isAcpSessionKey,
  resolveThreadParentSessionKey,
  // Normalization
  normalizeMainKey,
  normalizeAgentId,
  sanitizeAgentId,
  normalizeAccountId,
  // Key building
  toAgentRequestSessionKey,
  toAgentStoreSessionKey,
  resolveAgentIdFromSessionKey,
  buildAgentMainSessionKey,
  buildAgentPeerSessionKey,
  buildGroupHistoryKey,
  resolveThreadSessionKeys,
} from "./session-key.js";
