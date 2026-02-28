# Punk Records

**A living brain that remembers everything you build.**

Punk Records is a persistent knowledge system for Claude Code — inspired by Dr. Vegapunk's Punk Records from One Piece. It's not a filing cabinet. It's a thinking system that learns from every session, extracts patterns, and gets smarter over time.

---

## What It Does

### Persistent Memory Across Sessions
Every time you work with Claude Code, Punk Records:
- Remembers what you were doing
- Recalls decisions you made and why
- Surfaces lessons you learned
- Tracks what's still pending
- Knows what problems blocked you

### Auto-Distillation of Knowledge
The brain doesn't just store events — it **extracts intelligence**:
- Timeline events → Rich markdown files (decisions.md, lessons.md, problems.md)
- Session recordings → Searchable patterns
- Raw data → Permanent, human-readable knowledge

### Semantic Search
Ask the brain questions in natural language:
- "What did I learn about offline-first architecture?"
- "Why did I choose Resend for email delivery?"
- "What problems blocked the Pulse project?"

The brain searches by **meaning**, not just keywords.

---

## Architecture

```
punk-record/
├─ punk-records/              ← The knowledge base (markdown + JSON)
│  ├─ .brain/                 ← Intelligence layer (graph, search index)
│  │  ├─ punk-records.db      ← Knowledge graph (nodes, edges, inferences)
│  │  ├─ search-index.json    ← Semantic search index (10MB)
│  │  ├─ query-log.jsonl      ← Usage analytics
│  │  └─ graph.jsonl          ← JSONL backup of graph
│  ├─ core/                   ← Your identity, philosophy, anti-patterns
│  ├─ memory/                 ← Project and client memories
│  │  └─ projects/
│  │     └─ {project}/
│  │        ├─ timeline.jsonl    ← Every event during sessions
│  │        ├─ state.json        ← Current phase, health, pending work
│  │        ├─ decisions.md      ← Auto-generated from timeline
│  │        ├─ lessons.md        ← Auto-generated from timeline
│  │        └─ sessions/         ← Full session records
│  ├─ patterns/               ← Reusable code, design, strategy patterns
│  └─ context/                ← Market context (Tanzania, Africa)
│
└─ punk-records-mcp/          ← MCP server (the API to the brain)
   ├─ src/
   │  ├─ engines/             ← Session manager, knowledge graph
   │  ├─ search/              ← Semantic search (Orama + embeddings)
   │  ├─ tools/               ← MCP tools (18 total)
   │  └─ index.ts             ← Server entry point
   └─ dist/                   ← Compiled TypeScript
```

---

## How It Works

### 1. Start a Session
```
Call: begin_project_session(cwd="/path/to/project")
```
The brain:
- Auto-detects project name from path
- Loads what happened last session
- Shows pending work, blockers, recent decisions
- Returns full context to Claude

### 2. Work and Record Events
As you work, record significant moments:
```
record_event(
  event_type="decision",
  description="Use Resend API for email delivery",
  details={
    why: "Excellent deliverability, DKIM/SPF out of box",
    alternatives: "SendGrid, AWS SES"
  }
)
```

Event types: `decision`, `lesson_learned`, `problem_identified`, `breakthrough`, `blocker_hit`, etc.

### 3. End Session → Auto-Distillation
```
Call: end_project_session(summary="Built email pipeline")
```
The brain:
- Extracts all decisions from timeline → `decisions.md`
- Extracts all lessons → `lessons.md`
- Extracts problems → `problems.md`
- **Auto-indexes** the generated files for search
- Updates project state

---

## The Intelligence Layer (`.brain/`)

### Why It Exists
The markdown files in `punk-records/` are **source knowledge** — what you write.
The `.brain/` directory contains **learned intelligence** — what the system discovers.

### What's Inside

**`punk-records.db`** (SQLite)
- Knowledge graph: nodes (concepts, projects, patterns) and edges (relationships)
- Evolution tracking: how knowledge changed over time
- Inferences: patterns the brain discovered on its own
- Tensions: detected contradictions between beliefs/decisions

**`search-index.json`** (10MB, Orama format)
- Semantic search index with embeddings
- Maps markdown content to 384-dimensional vectors
- Enables "meaning-based" search, not just keywords

**`query-log.jsonl`**
- Every search query, every tool call
- Used by intelligence engine to provide proactive suggestions

**`graph.jsonl`**
- JSONL backup of knowledge graph entities and relationships

### Why Version Control It?
The brain gets smarter over time. That intelligence is **too precious to lose**.

- Hardware fails → brain survives in git
- Clone repo on new machine → full intelligence intact
- Git history shows how knowledge evolved

Only `.brain/.cache/` (downloaded embedding models, 23MB) is gitignored — those can be re-downloaded.

---

## Backup Strategy

**Primary:** Git. Every commit preserves the brain's full state.

**Why not cloud backup alone?**
- No version history
- No visibility into how intelligence evolved
- Requires manual recovery

**Why not regenerate the index?**
- Search index can be rebuilt from markdown
- But query logs, graph inferences, evolution history — those can't be regenerated
- The brain **learns** from usage, it's not just a cache

---

## Tech Stack

**Brain (punk-records/):**
- Markdown files (human-written knowledge)
- JSONL timelines (session events)
- JSON state files (project metadata)

**Intelligence (punk-records-mcp/):**
- TypeScript + Node.js
- SQLite (knowledge graph)
- Orama (search index)
- Transformers.js (embeddings, Xenova/all-MiniLM-L6-v2)
- Chokidar (file watcher for auto-indexing)
- MCP SDK (Claude Code integration)

---

## Available Tools (MCP)

The brain exposes 18+ tools to Claude Code:

### Session Management
- `begin_project_session` — Start work, load context
- `record_event` — Capture decisions, lessons, problems
- `end_project_session` — End session, auto-distill knowledge
- `recall_project` — Quick memory check without starting session

### Search & Knowledge
- `search_memory` — Semantic search across all knowledge
- `get_identity` — Your core values, philosophy, anti-patterns
- `get_patterns` — Reusable code/design/strategy patterns
- `get_project_context` — Full project history and state

### Intelligence
- `run_inference` — Discover new patterns from existing knowledge
- `check_decision_tensions` — Verify decision doesn't conflict with philosophy
- `explore_connections` — Find unexpected relationships
- `project_evolution` — See how a project changed over time

### Graph
- `add_relationship` — Connect concepts in knowledge graph
- `query_relationships` — Traverse the graph

---

## Philosophy

**This is how you think:**

> "If someone else sat down and did it, I can too."

The brain applies the same principle. If Claude can read timeline events and extract lessons, the **system should do it automatically**. Accumulated events → automatic distillation → searchable knowledge.

**The brain gets smarter without manual intervention.**

---

## Current Focus

Building Punk Records — the living brain MCP server that Claude Code can tap into and contribute to. Inspired by Vegapunk's Punk Records from One Piece.

See: `punk-records/active/current-focus.md`

---

## Projects Using This Brain

- **ElimuAfrica** — AI-powered offline-first education platform (the cathedral)
- **Pulse** — Intelligent email outreach system with behavioral learning
- **Narrative Engine** — Multi-persona autonomous content system for LinkedIn
- **Pane** — Window manager experiment
- **Elimu Community Light** — NGO brand identity

Each project has:
- Full timeline of sessions
- Auto-generated decisions.md and lessons.md
- State tracking (phase, health, blockers)
- Searchable knowledge

---

## Getting Started

### For Claude Code
The MCP is already configured. Just start a session:
```
begin_project_session(cwd="/path/to/your/project")
```

### For Humans
Browse the knowledge base:
```bash
cd punk-records/
cat core/identity.md              # Who Aslam is
cat memory/projects/pulse/lessons.md  # What was learned
cat patterns/code/offline-first.md    # Reusable patterns
```

Search the brain:
```bash
# Via MCP (in Claude Code session)
search_memory("offline-first architecture lessons")
```

---

## Maintenance

### Reindex Everything
If search results seem stale:
```bash
cd punk-records-mcp
rm -rf punk-records/.brain/search-index.json
# Next search will trigger full rebuild
```

### Clean Up Stale MCP Processes
```bash
ps aux | grep punk-records-mcp | grep -v grep
kill <pid>
```

### Check Brain Stats
```bash
cd punk-records/.brain
wc -l *.jsonl          # Count events
du -sh search-index.json  # Index size
sqlite3 punk-records.db ".tables"  # Graph structure
```

---

## Version History

- **v0.1.0** — Initial Punk Records architecture
- **Feb 26, 2026** — Migrated intelligence to `.brain/` for durability
- **Feb 28, 2026** — Auto-distillation: timeline → decisions.md, lessons.md, problems.md

---

## The Vegapunk Theory

This system implements the Vegapunk theory:

> **Central knowledge base + specialized agents sharing one brain**

**Punk Records MCP** (this system):
- Central brain that grows smarter over time
- Specialized tools for different purposes
- Reactive (responds when queried)

**Narrative Engine** (first implementation):
- Same theory, different expression
- Multiple AI personas with behavioral autonomy
- Proactive (acts on impulses)

Both share DNA: central knowledge, specialized interfaces, human in the loop, learning from every interaction.

---

**Built by Aslam. Powered by Claude Code.**
