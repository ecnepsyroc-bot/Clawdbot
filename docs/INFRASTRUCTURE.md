# OpenClaw Infrastructure Map

**Last Updated:** 2026-03-10
**Purpose:** Document OpenClaw's infrastructure dependencies, especially shared components with Cambium

⚠️ **IMPORTANT**: OpenClaw shares infrastructure with Cambium (Pi, Docker, WireGuard VPN, Dejavara startup chain). Changes to Cambium's infrastructure (Cloudflare migration, backup plans) must account for OpenClaw. See [Cross-System Dependencies](#cross-system-dependencies).

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LAPTOP (DEJAVARA) - Windows 11                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  OpenClaw Node (Scheduled Task: "OpenClaw Node")                        │
│  ├─> Script: C:\Users\cory\.openclaw\node-watchdog.cmd                  │
│  ├─> Runs: C:\Dev\Dejavara\OpenClaw\dist\index.js node run              │
│  ├─> Connects to: localhost:18789 (via SSH tunnel)                      │
│  └─> Exposes: localhost:18792 (Chrome extension relay)                  │
│       └─> Used by: Browser automation tools                             │
│                                                                          │
│  SSH Tunnel (background process)                                        │
│  ├─> Command: ssh -L 18789:127.0.0.1:18789 dejavara@192.168.1.76       │
│  ├─> Forward: localhost:18789 → Pi gateway:18789                        │
│  ├─> Auth: Ed25519 key (~/.ssh/id_ed25519)                              │
│  └─> Why: Newer OpenClaw blocks plaintext ws:// to non-loopback hosts   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ SSH tunnel (encrypted)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ RASPBERRY PI 5 (phteah-pi) - 192.168.1.76                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  OpenClaw Gateway (Docker container: openclaw)                          │
│  ├─> Image: openclaw:pi (locally built, 2.88 GB)                        │
│  ├─> Ports: 18789 (gateway), 18790 (bridge)                             │
│  ├─> Bind: LAN (0.0.0.0) - accessible from entire network               │
│  ├─> Command: openclaw gateway --bind lan --port 18789                  │
│  ├─> Auth: Token-based (CLAWDBOT_GATEWAY_TOKEN)                         │
│  │                                                                       │
│  └─> Persistent Volumes:                                                │
│      ├─> /mnt/data/docker/openclaw/config → /home/node/.openclaw        │
│      │    ├─> openclaw.json (main config - agents, models, channels)    │
│      │    ├─> credentials/ (API keys, telegram pairing)                 │
│      │    ├─> identity/ (device-auth.json, device.json)                 │
│      │    ├─> agents/ (chair, wife, grok, deepseek, gemini, groq)       │
│      │    │    └─> each agent: agent/, sessions/, workspace/            │
│      │    │         └─> workspace/data/*.db (SQLite - council history)  │
│      │    ├─> cron/, telegram/, memory/, exec-approvals.json            │
│      │                                                                   │
│      └─> /mnt/data/docker/openclaw/workspace → /home/node/.openclaw/workspace
│           └─> Shared workspace for agents                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Deployment Details**: See `OpenClaw/CLAUDE.md` for local setup instructions.

---

## Port Registry (OpenClaw-Specific)

| Port | Service | Protocol | Binding | Accessible From |
|------|---------|----------|---------|-----------------|
| **18789** | OpenClaw Gateway | WebSocket | 0.0.0.0 (LAN) | Home network + WireGuard VPN |
| **18790** | OpenClaw Bridge | HTTP | 0.0.0.0 (LAN) | Home network + WireGuard VPN |
| **18792** | Browser Relay | WebSocket | 127.0.0.1 (localhost) | Laptop only (Chrome extension) |

**Shared Ports** (managed by Cambium/Phteah-pi):
- 5432: PostgreSQL (Cambium only - OpenClaw uses SQLite)
- 51820: WireGuard VPN
- 22000/8384: Syncthing (deploys skills/identity for both OpenClaw and Cambium)

**Port Registry (Full)**: See `Phteah-pi/docs/PORT-REGISTRY.md` for complete Pi port allocation.

---

## Persistent State Inventory

### Critical State (Data Loss = Service Rebuild)

| Path | Content | Size | Backup Status |
|------|---------|------|---------------|
| `/mnt/data/docker/openclaw/config/openclaw.json` | Gateway config (agents, models, auth) | 9.5 KB | ✅ Docker volume backup |
| `/mnt/data/docker/openclaw/config/credentials/` | API keys, OAuth tokens | - | ✅ Docker volume backup |
| `/mnt/data/docker/openclaw/config/identity/` | Device identity, pairing tokens | - | ✅ Docker volume backup |
| `/mnt/data/docker/openclaw/config/agents/*/agent/` | Per-agent API credentials | - | ✅ Docker volume backup |
| `/mnt/data/docker/openclaw/config/agents/*/workspace/data/*.db` | SQLite (council history) | ~36 KB/agent | ✅ Docker volume backup |
| `/mnt/data/docker/openclaw/config/exec-approvals.json` | Security approval whitelist | - | ✅ Docker volume backup |

### Important State (Data Loss = Inconvenience)

| Path | Content | Backup Status |
|------|---------|---------------|
| `/mnt/data/docker/openclaw/config/agents/*/sessions/` | Session state | ✅ Docker volume backup |
| `/mnt/data/docker/openclaw/config/memory/` | Vector search embeddings | ✅ Docker volume backup |
| `/mnt/data/docker/openclaw/config/telegram/` | Telegram pairing state | ✅ Docker volume backup |
| `/mnt/data/docker/openclaw/workspace/` | Shared agent workspace | ✅ Docker volume backup |

### Laptop State (Node-Specific)

| Path | Content | Backup Status |
|------|---------|---------------|
| `C:\Users\cory\.openclaw\` | Node config, device auth | ❌ Laptop-only (no backup) |
| `C:\Users\cory\.ssh\id_ed25519` | SSH tunnel authentication key | ❌ Laptop-only |
| `C:\Users\cory\phteah-pi.conf` | WireGuard VPN config | ❌ Laptop-only |

**Backup Strategy**: See [Cross-System Dependencies](#cross-system-dependencies) for Pi backup automation.

---

## Database Architecture

**OpenClaw**: SQLite per-agent (embedded in Docker volumes)
- **Location**: `/mnt/data/docker/openclaw/config/agents/*/workspace/data/*.db`
- **Example**: `tracker.db` in chair agent (~36 KB)
- **Purpose**: Council session history, agent memory, task tracking
- **Backup**: Included in Docker volume backups

**NOT PostgreSQL**: OpenClaw does NOT use the Cambium PostgreSQL instance on port 5432.

**Shared with Cambium?** ❌ No - completely independent storage systems.

---

## Environment Variables & Tokens

### Pi Gateway (Docker container)

| Variable | Purpose | Set Where |
|----------|---------|-----------|
| `ANTHROPIC_API_KEY` | Anthropic API access | `~/homeserver/.env` |
| `CLAWDBOT_GATEWAY_TOKEN` | Gateway auth (must match node) | `openclaw.json` (`gateway.auth.token`) |
| `HOME` | Container user home | Docker config (`/home/node`) |
| `TZ` | Timezone | Docker config (`America/Los_Angeles`) |

**API Keys Embedded in openclaw.json**:
- `tools.web.search.apiKey` (Brave Search)
- `messages.tts.elevenlabs.apiKey` (ElevenLabs TTS)
- `models.providers.*.apiKey` (xAI, DeepSeek, Google, Groq)
- `channels.telegram.accounts.*.botToken` (Telegram bots)

### Laptop Node (native Windows)

| Variable | Purpose | Set Where |
|----------|---------|-----------|
| `CLAWDBOT_GATEWAY_TOKEN` | Must match Pi gateway token | `node-autostart.cmd` (line 21) |
| `PI_HOST` | Pi IP address (192.168.1.76) | `node-autostart.cmd` (line 25) |
| `TUNNEL_PORT` | SSH tunnel port (18789) | `node-autostart.cmd` (line 27) |

**Token Rotation**: Requires updating both Pi `openclaw.json` AND laptop `node-autostart.cmd`, then restarting node.

---

## Cross-System Dependencies

### Shared Infrastructure with Cambium

| Component | OpenClaw Usage | Cambium Usage | Conflict Risk |
|-----------|----------------|---------------|---------------|
| **Pi Hardware** | Gateway container, persistent storage | PostgreSQL, CambiumApi (future) | Low - different services |
| **Docker Engine** | openclaw container | (Cambium uses Railway, not Pi Docker yet) | None currently |
| **USB Storage** | `/mnt/data/docker/openclaw/` | `/mnt/hdd/cambium/postgresql/` | Medium - same physical drive |
| **Network Stack** | Ports 18789-18790 | Port 5432, Cloudflare tunnels | Low - different port ranges |
| **WireGuard VPN** | Remote node access | Shop-to-home Cambium access | None - VPN is shared tunnel |
| **Syncthing** | Deploys skills/identity | Deploys skills/identity | None - same purpose |

### Cambium Data Resilience Plan Integration

OpenClaw must be included in Cambium's infrastructure workstreams:

1. **Cloudflare Tunnel Unification** (Cambium Milestone 2):
   - OpenClaw currently uses SSH tunnels (laptop → Pi:18789)
   - When SSH tunnels are deprecated, OpenClaw needs Cloudflare Tunnel entry
   - **Required**: `openclaw.phteah-pi.duckdns.org` subdomain pointing to gateway:18789
   - **Impact**: Node config must change from `localhost:18789` → `wss://openclaw.domain.com`
   - **Fallback**: Keep SSH tunnel working until Cloudflare proven stable

2. **Pi Backup Automation** (Cambium Milestone 3):
   - OpenClaw persistent state is in `/mnt/data/docker/openclaw/`
   - **Currently NOT automated** - must add to backup cron
   - **Required**: Weekly Sunday 3am backup (`0 3 * * 0`)
   - **Retention**: GFS (daily, weekly, monthly) or at least 4 rotating backups
   - **Scope**: All Docker volumes + config + SQLite databases

3. **Dejavara Startup Chain** (Workstation Operations):
   - OpenClaw node uses scheduled task "OpenClaw Node" (triggers on logon/wake)
   - **Documented in**: `C:\Dev\Dejavara\docs\WORKSTATION-INVENTORY.md`
   - **Shared with**: Cambium sync tasks (Sync-From-Cambium-Tunnel, Sync-Server-Projects)
   - **Impact**: Startup order matters - network must be up before node connects

### Migration Risks

**If Cambium migrates to Cloudflare Tunnel without coordinating**:
- ❌ OpenClaw node loses connection (SSH tunnel deprecated)
- ❌ Remote access broken (WireGuard removed before Cloudflare ready)
- ❌ Backup incomplete (OpenClaw persistent state not in scope)

**Mitigation**:
- ✅ Test Cloudflare Tunnel for OpenClaw BEFORE deprecating SSH
- ✅ Add OpenClaw to Pi backup automation BEFORE relying on it
- ✅ Document shared infrastructure in both plans (Cambium + OpenClaw)

---

## References

### OpenClaw Documentation
- **Local Deployment**: `OpenClaw/CLAUDE.md` (this file documents laptop setup)
- **Agent Council**: `OpenClaw/AGENTS.md` (council hierarchy, agent config)
- **Change Log**: `OpenClaw/CHANGELOG.md`

### Shared Infrastructure Documentation
- **Pi Port Registry**: `Phteah-pi/docs/PORT-REGISTRY.md`
- **Pi Build Inventory**: `Phteah-pi/docs/BUILD.md`
- **Workstation Services**: `C:\Dev\Dejavara\docs\WORKSTATION-INVENTORY.md`
- **Cambium Data Resilience Plan**: `C:\Dev\Dejavara\Cambium\docs\CAMBIUM-DATA-RESILIENCE-PLAN.md` (if exists)

### Network & Security
- **OpenClaw Node Setup**: `C:\Users\cory\.claude\projects\c--Dev-Dejavara\memory\openclaw-node-setup.md`
- **Network Topology**: `C:\Users\cory\.claude\projects\c--Dev-Dejavara\memory\MEMORY.md`

---

## Change Log

### 2026-03-10
- **Created**: Infrastructure map documenting Pi gateway, network paths, persistent state
- **Audited**: Shared dependencies with Cambium (Pi hardware, Docker, VPN, backups)
- **Identified**: Cloudflare migration risks (SSH tunnel deprecation impacts OpenClaw)
- **Recommended**: Add OpenClaw to Cambium's Cloudflare tunnel + backup automation workstreams
