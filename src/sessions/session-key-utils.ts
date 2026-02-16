/**
 * Session key parsing utilities.
 *
 * @deprecated Import from "../domain/session/index.js" instead.
 * This file is kept for backwards compatibility.
 */

export type { ParsedAgentSessionKey } from "../domain/session/session-key.js";

export {
  parseAgentSessionKey,
  isSubagentSessionKey,
  isAcpSessionKey,
  resolveThreadParentSessionKey,
} from "../domain/session/session-key.js";
