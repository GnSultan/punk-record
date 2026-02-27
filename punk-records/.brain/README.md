# The Brain

This directory contains all learned intelligence from the Punk Records MCP server. Unlike the markdown files in the parent directory (which are human-written knowledge), this is machine-learned knowledge that gets smarter over time.

## What Lives Here

### `graph.jsonl`
The knowledge graph — entities (concepts, projects, patterns, people) and their relationships. This grows as the system discovers connections between ideas.

**Format:** JSONL (one JSON object per line)
**Tracked in git:** Yes
**Why it matters:** Relationships are knowledge. Losing this means losing all the discovered connections between concepts.

### `punk-records.db` (+ `.db-shm`, `.db-wal`)
SQLite database storing:
- Nodes (knowledge graph entities)
- Edges (relationships between entities)
- Node versions (evolution history — how knowledge changed over time)
- Inferences (patterns the system discovered on its own)
- Tensions (detected contradictions between beliefs/decisions)

**Format:** SQLite database
**Tracked in git:** Yes
**Why it matters:** This is the "working memory" — the live state of everything the system has learned. Without it, the MCP starts from zero intelligence.

### `search-index.json`
Orama search index with embeddings for semantic search. Maps all markdown content to 384-dimensional vectors that enable "meaning-based" search instead of just keyword matching.

**Format:** JSON (Orama-specific format)
**Tracked in git:** Yes
**Size:** ~10MB
**Why it matters:** Expensive to rebuild (requires re-processing all files and re-generating embeddings). Tracks which content is semantically similar to other content.

### `query-log.jsonl`
Analytics — every search query, every tool call, every pattern of usage. The system learns from this to provide better suggestions.

**Format:** JSONL
**Tracked in git:** Yes
**Why it matters:** This is how the system gets proactive. It learns what you ask for often and surfaces related knowledge before you ask.

## What's NOT Here

### `.brain/.cache/` (gitignored)
Downloaded embedding model weights (23MB). Can be re-downloaded automatically from Hugging Face. No need to version control.

## Backup Strategy

**Primary backup:** Git. Every commit preserves the full state of the brain.

**Why git for large files?**
- 10MB search index is not large by modern standards
- The knowledge is too precious to risk losing to hardware failure
- Git history lets you see how intelligence evolved over time
- If size becomes an issue (unlikely), Git LFS exists

**Recovery:**
If you clone this repo on a new machine, the brain comes with it. The MCP is immediately smart — no re-indexing, no re-learning.

## Philosophy

The brain is not "derived data" — it's learned knowledge. Treating it as regenerable cache would be like treating your own memories as disposable because "you could just re-experience everything."

Every search makes it smarter. Every inference teaches it new patterns. Every query log entry helps it predict what you need next.

This directory is where Punk Records becomes more than a file system — it's where it becomes a thinking system.
