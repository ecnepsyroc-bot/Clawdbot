/**
 * Session key building and normalization utilities.
 *
 * @deprecated Import from "../domain/session/index.js" instead.
 * This file is kept for backwards compatibility.
 */

export type { ParsedAgentSessionKey } from "../domain/session/session-key.js";

export {
  // Constants
  DEFAULT_AGENT_ID,
  DEFAULT_MAIN_KEY,
  DEFAULT_ACCOUNT_ID,
  // Parsing (re-exported from session-key-utils)
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
} from "../domain/session/session-key.js";
