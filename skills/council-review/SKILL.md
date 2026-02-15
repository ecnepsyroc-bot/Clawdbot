---
name: council-review
description: "Submit code, specs, or questions to the LLM Council for multi-model deliberation and review."
metadata: {"moltbot":{"emoji":"\u2696\ufe0f","requires":{"env":["COUNCIL_URL"]}}}
---

# Council Review Skill

Interact with the LLM Council API running on Phteah-Pi (192.168.1.76:8001) for multi-model code review, spec review, architectural decisions, and pre-merge quality gates.

The Council uses 10 LLM models in a 3-stage process: independent responses, anonymous peer ranking, and chairman synthesis.

## API Base

Default: `http://192.168.1.76:8001`

Set via environment variable `COUNCIL_URL` or use the default.

## Review Modes

| Mode | Purpose |
|------|---------|
| `general` | Open-ended question or discussion (default) |
| `spec-review` | Review a feature specification before implementation |
| `code-review` | Review code for bugs, security, and architecture |
| `architecture-decision` | Evaluate architectural trade-offs |
| `pre-merge` | Binary APPROVE/BLOCK vote for merge readiness |

## Usage: Two-Step API Flow

### 1. Create a conversation

```bash
curl -s -X POST http://192.168.1.76:8001/api/conversations \
  -H "Content-Type: application/json" \
  -d '{}'
```

Returns: `{"id": "conv-uuid", ...}`

### 2. Send content with review mode

```bash
curl -s -X POST http://192.168.1.76:8001/api/conversations/{id}/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your content here...",
    "options": {
      "mode": "spec-review"
    }
  }'
```

Returns: `{"stage1": [...], "stage2": [...], "stage3": {...}, "metadata": {...}}`

The synthesis is in `stage3.response`. For pre-merge mode, the verdict is in `metadata.verdict`.

## Common Workflows

### Review a spec file

```bash
CONTENT=$(cat docs/specs/features/MY-FEATURE.spec.md)
# Create conversation, then send with mode "spec-review"
```

Or use the PowerShell script:
```powershell
.\scripts\council-review.ps1 -File "docs/specs/features/MY-FEATURE.spec.md" -Mode spec-review
```

### Pre-merge quality gate

```bash
DIFF=$(git diff main..HEAD)
# Create conversation, then send diff with mode "pre-merge"
# Check metadata.verdict.verdict for APPROVE or BLOCK
```

Or use the PowerShell script:
```powershell
.\scripts\council-gate.ps1
.\scripts\council-gate.ps1 -Branch feature/my-branch
.\scripts\council-gate.ps1 -Force  # Override BLOCK
```

### Ask an architectural question

```bash
# Create conversation, then send question with mode "architecture-decision"
# Content: "Should we use Redis or PostgreSQL pub/sub for real-time notifications?"
```

## Response Structure

### Standard response (all modes)

- `stage1[]` — Individual model responses with confidence scores
- `stage2[]` — Anonymous peer rankings
- `stage3.response` — Chairman's synthesized answer
- `metadata.mode` — Review mode used
- `metadata.features.fast_path_used` — True if Stage 2 was skipped (models agreed)
- `metadata.consensus` — Agreement score across models

### Pre-merge verdict (pre-merge mode only)

```json
{
  "metadata": {
    "verdict": {
      "verdict": "APPROVE",
      "votes": { "approve": 7, "block": 3 },
      "confidence": 0.7,
      "blocking_reasons": ["model-name: reason..."],
      "model_votes": { "model/name": "approve" }
    }
  }
}
```

Block threshold: >30% of models vote BLOCK triggers a BLOCK verdict.

## Health Check

```bash
curl http://192.168.1.76:8001/health
# Returns: {"status": "healthy", ...}
```

## Troubleshooting

If the Council is unavailable:
```bash
ssh dejavara@192.168.1.76
cd ~/llm-council && docker compose -f docker-compose.prod.yml up -d
```
