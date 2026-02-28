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

This intelligence can't be regenerated. It's learned, not derived. That's why it's version controlled.

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

Git. Every commit preserves the brain's full state.

The intelligence layer (`.brain/`) is version controlled because it's learned knowledge that grows over time. If my Mac dies, I clone the repo and the brain is intact — all decisions, all lessons, all search intelligence.

Only `.brain/.cache/` (downloaded embedding models, 23MB) is gitignored. Those can be re-downloaded.

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

**Refuse to play safe:** Version-controlling a 10MB search index feels heavy. Doing it anyway because the intelligence is too valuable to lose.

---

Built by Aslam.
Powered by Claude Code.
