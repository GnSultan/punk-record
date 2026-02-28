# Punk Records

A brain that remembers everything.

---

## Why This Exists

Building things — real things, complex things — requires memory that survives beyond a single conversation. Every time I work with Claude Code, context gets lost. Decisions I made yesterday? Gone. Lessons I learned the hard way? Forgotten. Problems I solved? Starting from scratch again.

Punk Records fixes this. It's persistent memory for every session. Not a filing cabinet — a thinking system that learns from what I do and gets smarter over time.

Inspired by Dr. Vegapunk's Punk Records from One Piece: one central knowledge base, multiple specialized agents accessing it, growing smarter with every interaction.

---

## What It Does

When I start a session, the brain remembers:
- What I was building
- What decisions I made and why
- What lessons I learned
- What's still pending
- What blocked me

When the session ends, it extracts:
- Decisions → `decisions.md` with reasoning and alternatives
- Lessons → `lessons.md` with context and what actually worked
- Problems → `problems.md` with how they were resolved

Everything is searchable. Not by keywords — by meaning.

---

## How It Works

```
Start session → Load full context
  ↓
Work → Record decisions, lessons, problems
  ↓
End session → Auto-extract knowledge
  ↓
Generate markdown → Auto-index for search
  ↓
Knowledge persists forever
```

The brain doesn't ask me to maintain it. It maintains itself.

---

## The Structure

```
punk-records/              ← The knowledge base
  ├─ .brain/               ← Intelligence layer
  │  ├─ punk-records.db    ← Knowledge graph (nodes, edges, inferences)
  │  ├─ search-index.json  ← Semantic search (10MB)
  │  ├─ query-log.jsonl    ← Usage analytics
  │  └─ graph.jsonl        ← Graph backup
  │
  ├─ core/                 ← Identity, philosophy, anti-patterns
  ├─ memory/               ← Project memories
  │  └─ projects/{name}/
  │     ├─ timeline.jsonl     ← Every event during sessions
  │     ├─ decisions.md       ← Auto-generated
  │     ├─ lessons.md         ← Auto-generated
  │     └─ state.json         ← Current phase, health, blockers
  │
  ├─ patterns/             ← Reusable code, design, strategy patterns
  └─ context/              ← Market context (Tanzania, Africa)

punk-records-mcp/        ← MCP server (the API to the brain)
  └─ src/
     ├─ engines/         ← Session manager, knowledge graph
     ├─ search/          ← Semantic search (Orama + embeddings)
     └─ tools/           ← 18+ MCP tools
```

---

## Why `.brain/` Exists

The markdown files are what I write. The `.brain/` directory is what the system learns.

**`punk-records.db`** — Knowledge graph. Nodes (concepts, decisions, patterns) and edges (relationships). Evolution tracking. Inferences the system discovered on its own.

**`search-index.json`** — Semantic search index. Embeddings that enable meaning-based search, not just keywords.

**`query-log.jsonl`** — Every search query. The system learns from what I ask for and surfaces related knowledge proactively.

This intelligence can't be regenerated. It's learned, not derived. That's why it's backed up to R2.

---

## The Workflow

### 1. Start Session
```
begin_project_session(cwd="/path/to/project")
```
The brain auto-detects the project name, loads:
- What happened last session
- Pending work
- Recent decisions
- Open blockers

### 2. Work & Record
```
record_event(
  event_type="decision",
  description="Use Resend API for email delivery",
  details={
    why: "Excellent deliverability",
    alternatives: "SendGrid, AWS SES"
  }
)
```

Event types: `decision`, `lesson_learned`, `problem_identified`, `breakthrough`, `blocker_hit`

### 3. End Session
```
end_project_session(summary="Built email pipeline")
```
The brain:
- Extracts decisions → `decisions.md`
- Extracts lessons → `lessons.md`
- Extracts problems → `problems.md`
- Auto-indexes everything for search
- Updates project state

---

## Backup Strategy

**Local + Cloud.** Not git — the knowledge is private.

`punk-records/` lives in `~/punk-records`, outside this repo. This repo only contains the MCP server code (public). The data stays private.

**Backups:**
- **Automatic:** After every session ends (throttled to max once/hour)
- **Local:** `.brain/backups/` (keeps 7 most recent)
- **Cloud:** Cloudflare R2 with tiered retention
  - Last 24h: keep all
  - Last 7 days: 1 per day
  - Last 30 days: 1 per week
  - Older: delete

**Manual backup:**
```bash
cd punk-records-mcp
npm run backup
```

Creates timestamped `.tar.gz` of `.brain/` directory (excludes cache), stores locally, uploads to R2 if configured.

**Restore:**
Download from R2 or use local backup, extract to `.brain/`. The backup script handles this.

**R2 config** (optional, in `punk-records-mcp/.env`):
```bash
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=pulse-backups  # or your own bucket
```

See `.env.example` for template. If R2 isn't configured, local backups still work (7 most recent kept in `.brain/backups/`).

---

## The Vegapunk Theory

This is the second implementation of an idea: central knowledge base, specialized agents, human in the loop.

**First implementation:** Narrative Engine
Multiple AI personas sharing one brain, autonomous behavior, building audience on LinkedIn before ElimuAfrica launches.

**Second implementation:** Punk Records MCP
Central knowledge, specialized tools, reactive (responds when queried), persistent memory for every session.

Both share the same DNA. The theory keeps evolving.

---

## Tech Stack

**Brain:**
- Markdown (human-written knowledge)
- JSONL (session events)
- JSON (project state)

**Intelligence:**
- TypeScript + Node.js
- SQLite (knowledge graph)
- Orama (search index)
- Transformers.js (embeddings)
- Chokidar (file watcher)
- MCP SDK (Claude Code integration)

---

## Philosophy

The brain applies the same principle I do:

> "If someone else sat down and did it, I can too."

If Claude can read timeline events and extract lessons, the system should do it automatically. No manual summarization. No maintenance burden.

The brain gets smarter without me having to think about it.

---

## Principles Applied

**Start with why:** The brain exists because persistent memory across sessions matters. Without it, every conversation starts from scratch.

**Authenticity over promotion:** No marketing language. No hype. Just what it does and why.

**Build with precision:** Extract only what matters — decisions, lessons, problems. Not tech stack, not file lists. Intelligence, not inventory.

**Refuse to play safe:** The knowledge is private, but the intelligence is too valuable to lose. Local + cloud backups, not git.

---

Built by Aslam.
Powered by Claude Code.
