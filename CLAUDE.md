AGENTS.md

# Local Deployment — Cory's Laptop (P16)

## Architecture

```
Pi (192.168.1.76)                    Laptop (DEJAVARA / 10.8.0.3)
┌──────────────────┐                 ┌──────────────────────────────────┐
│  OpenClaw Gateway │◄── WireGuard ──►│  OpenClaw Node (node-watchdog)  │
│  :18789           │    10.8.0.0/24  │  dist/index.js                  │
│  :18790 (bridge)  │                 │                                  │
└──────────────────┘                 │  ┌────────────────────────────┐  │
                                      │  │ Browser Relay :18792       │  │
                                      │  │ (127.0.0.1 only)           │  │
                                      │  │ Chrome ext ↔ /extension WS │  │
                                      │  │ CDP clients ↔ /cdp WS      │  │
                                      │  └────────────────────────────┘  │
                                      └──────────────────────────────────┘
```

## Key Ports (laptop-side, localhost only)

| Port  | Service             | Notes                              |
|-------|---------------------|------------------------------------|
| 18792 | Browser Relay (WS)  | Chrome extension ↔ CDP bridge      |

Gateway ports (18789, 18790) are on the Pi — see `Phteah-pi/docs/PORT-REGISTRY.md`.

## Node Watchdog

- **Script:** `~/.openclaw/node-watchdog.cmd`
- **Runs:** `C:\Dev\Dejavara\OpenClaw\dist\index.js node run --host 192.168.1.76 --port 18789 --display-name Cory-Laptop`
- **Auto-restart:** 15s delay on exit, clears stale device tokens before each start
- **Rebuild pickup:** Watchdog runs `dist/index.js` directly — `pnpm build` output is used on next restart

## Browser Relay Startup

The relay on :18792 starts **eagerly** when the node boots (patched 2026-02-15).

**Before the fix:** relay was lazy-started only on first `browser.proxy` request from the gateway — chicken-and-egg problem since the Chrome extension couldn't connect to trigger the first request.

**After the fix:** `ensureBrowserControlService()` is called right after GatewayClient creation in `src/node-host/runner.ts`. The call is:
- Guarded by `browserProxyEnabled` (both `browser.enabled` and `browserProxy.enabled` default `true`)
- Idempotent (cached promise in `browserControlReady`, port dedup in `serversByPort`)
- Fire-and-forget (`.catch(() => {})`) — node startup isn't blocked if relay fails

**If the extension shows `!` again:**
1. Check node is running: `netstat -an | findstr 18792` — should show LISTENING
2. If not listening, check node logs for startup errors
3. Verify `dist/node-host/runner.js` contains `ensureBrowserControlService` near line 427
4. Rebuild if needed: `cd C:\Dev\Dejavara\OpenClaw && pnpm build`
5. Kill node process, watchdog will restart with new build

## Auth Configuration

- **Profile:** `anthropic:claude-cli` (OAuth, auto-refreshing)
- **Config:** `~/.openclaw/clawdbot.json` has `auth.order.anthropic: ["anthropic:claude-cli"]`
- **Credentials:** `~/.openclaw/agents/main/agent/auth-profiles.json`
- **Subscription:** Claude Max (no per-token API charges)
- **Token types:** `sk-ant-oat01-` = access token, `sk-ant-ort01-` = refresh token

**If auth breaks:**
1. Run `claude auth status` to check Claude CLI's OAuth
2. If CLI OAuth is fresh, transplant tokens from `~/.claude/.credentials.json` into `auth-profiles.json`
3. Ensure `lastGood` points to `anthropic:claude-cli`

## Build

```bash
cd C:\Dev\Dejavara\OpenClaw
pnpm install    # first time / deps changed
pnpm build      # compiles to dist/
```

**Pre-commit hook note (Windows):** The `git-hooks/pre-commit` hook runs `oxfmt` via `spawnSync` without `shell: true`, which causes `EINVAL` on Windows `.cmd` shims. Use `--no-verify` for commits until this is fixed upstream. Files should still be formatted manually: `pnpm format`.