/**
 * Domain types for session bounded contexts.
 *
 * These types represent clean bounded contexts extracted from the monolithic SessionEntry.
 * SessionEntry remains as the persistence layer type; these are the domain models.
 */

import type { SessionId } from "@agentclientprotocol/sdk";

// Re-export complex types from persistence layer (to avoid circular deps)
export type {
  SessionSkillSnapshot,
  SessionSystemPromptReport,
} from "../../config/sessions/types.js";

// =============================================================================
// ProtocolSession - Runtime protocol state (in-memory only, not persisted)
// Owner: src/acp/
// =============================================================================

/**
 * Runtime state for an ACP protocol session.
 * This is in-memory only and resets on process restart.
 */
export type ProtocolSession = {
  /** Unique identifier for this session (ACP protocol ID) */
  sessionId: SessionId;
  /** Session routing key (e.g., "agent:main:main") */
  sessionKey: string;
  /** Working directory for this session */
  cwd: string;
  /** Timestamp when session was created */
  createdAt: number;
  /** Abort controller for canceling the active run */
  abortController: AbortController | null;
  /** ID of the currently active run, if any */
  activeRunId: string | null;
};

// =============================================================================
// ExecutionConfig - Tool execution configuration
// Owner: src/auto-reply/ (100% ownership)
// =============================================================================

/** Where tool execution happens */
export type ExecHost = "gateway" | "node" | "local";

/** Security mode for tool execution */
export type ExecSecurity = "deny" | "allowlist" | "permissive";

/** When to prompt user for permission */
export type ExecAsk = "always" | "on-miss" | "never";

/**
 * Configuration for how tools are executed in a session.
 * All fields are optional - falls back to agent/global config if not set.
 */
export type ExecutionConfig = {
  /** Where to execute tools (gateway server, remote node, or local) */
  execHost?: ExecHost;
  /** Security policy for tool execution */
  execSecurity?: ExecSecurity;
  /** When to ask user for tool permission */
  execAsk?: ExecAsk;
  /** Specific node ID to route execution to */
  execNode?: string;
};

// =============================================================================
// QueueConfig - Message queue behavior
// Owner: src/auto-reply/reply/queue/ (100% ownership)
// =============================================================================

/** How to handle incoming messages while processing */
export type QueueMode =
  | "steer" // Inject into current context
  | "followup" // Queue for after current response
  | "collect" // Batch messages before responding
  | "steer-backlog" // Steer with backlog processing
  | "steer+backlog" // Alias for steer-backlog
  | "queue" // Simple FIFO queue
  | "interrupt"; // Cancel current, process new

/** How to handle queue overflow */
export type QueueDrop = "old" | "new" | "summarize";

/**
 * Configuration for how messages are queued and processed.
 * All fields are optional - falls back to agent/global config if not set.
 */
export type QueueConfig = {
  /** How to handle incoming messages while processing */
  queueMode?: QueueMode;
  /** Debounce delay before processing queued messages (ms) */
  queueDebounceMs?: number;
  /** Maximum number of messages to queue */
  queueCap?: number;
  /** How to handle queue overflow */
  queueDrop?: QueueDrop;
};

// =============================================================================
// SessionRuntimeState - Transient state that should NOT persist to disk
// These fields reset on process restart - they're runtime state, not config
// =============================================================================

import type {
  SessionSkillSnapshot,
  SessionSystemPromptReport,
} from "../../config/sessions/types.js";

/**
 * Runtime state for a session that should NOT be persisted to disk.
 * This state resets on process restart - it represents "what the session
 * is doing right now" not "what the session is".
 *
 * Storing this in SessionEntry was a mistake - it creates stale data bugs
 * and bloats the session store file.
 */
export type SessionRuntimeState = {
  /** Whether system prompt has been sent in this session run */
  systemSent?: boolean;
  /** Last heartbeat text (for deduplication) */
  lastHeartbeatText?: string;
  /** When last heartbeat was sent (ms) */
  lastHeartbeatSentAt?: number;
  /** Map of CLI tool names to their session IDs */
  cliSessionIds?: Record<string, string>;
  /** Claude CLI session ID */
  claudeCliSessionId?: string;
  /** Snapshot of resolved skills for this session */
  skillsSnapshot?: SessionSkillSnapshot;
  /** Report of system prompt construction */
  systemPromptReport?: SessionSystemPromptReport;
  /** Whether the last run was aborted */
  abortedLastRun?: boolean;
};
