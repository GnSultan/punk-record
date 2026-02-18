# Punk Records Architecture
## A Living Brain for Claude Code to Tap Into

---

## Core Concept

Punk Records isn't just storage — it's structured memory that mirrors how you actually think. When Claude Code connects, it shouldn't feel like querying a database. It should feel like catching up with a collaborator who already knows the mission.

---

## Directory Structure

```
punk-records/
├── core/
│   ├── identity.md          # Who you are, your "why"
│   ├── philosophy.md        # Design & build principles
│   ├── voice.md             # How you communicate (brand voice)
│   └── anti-patterns.md     # Things you hate, mistakes to avoid
│
├── memory/
│   ├── projects/
│   │   ├── elimu-africa/
│   │   │   ├── context.md       # The why, the problem, the vision
│   │   │   ├── decisions.md     # Key choices made & reasoning
│   │   │   ├── patterns.md      # Reusable code/design patterns
│   │   │   └── lessons.md       # What worked, what didn't
│   │   ├── apple-empire/
│   │   ├── thabiti/
│   │   └── makando-travel/
│   │
│   ├── clients/
│   │   └── [client-name]/
│   │       ├── brand.md         # Their identity, voice, values
│   │       ├── context.md       # Business context, market position
│   │       └── history.md       # What you've built for them
│   │
│   └── experiments/
│       └── [idea-name].md       # Half-baked ideas, explorations
│
├── patterns/
│   ├── code/
│   │   ├── react-patterns.md
│   │   ├── offline-first.md
│   │   ├── three-js-setups.md
│   │   └── api-structures.md
│   │
│   ├── design/
│   │   ├── ui-principles.md
│   │   ├── animation-philosophy.md
│   │   └── color-systems.md
│   │
│   └── strategy/
│       ├── brand-frameworks.md
│       ├── storybrand-templates.md
│       └── positioning-methods.md
│
├── context/
│   ├── tanzania-market.md       # Local insights, problems, opportunities
│   ├── africa-tech.md           # Broader ecosystem understanding
│   └── target-audiences.md      # Who you build for, their realities
│
└── active/
    ├── current-focus.md         # What you're working on RIGHT NOW
    ├── open-questions.md        # Things you're still figuring out
    └── session-notes/
        └── [date]-[project].md  # Quick captures from work sessions
```

---

## MCP Server Design

### Tools to Expose

```javascript
// The MCP server exposes these tools to Claude Code

tools: [
  {
    name: "get_identity",
    description: "Get Aslam's core identity, philosophy, and voice",
    // Returns: core/*.md combined
  },
  
  {
    name: "get_project_context",
    description: "Get full context for a specific project",
    parameters: { project_name: string },
    // Returns: memory/projects/[name]/*.md
  },
  
  {
    name: "get_patterns",
    description: "Get coding/design patterns for a specific domain",
    parameters: { domain: "code" | "design" | "strategy", topic?: string },
    // Returns: relevant patterns/*.md
  },
  
  {
    name: "get_market_context",
    description: "Get Tanzania/Africa market insights",
    // Returns: context/*.md
  },
  
  {
    name: "get_current_focus",
    description: "What is Aslam working on right now?",
    // Returns: active/current-focus.md
  },
  
  {
    name: "search_memory",
    description: "Search across all records for relevant context",
    parameters: { query: string },
    // Returns: semantic search results across all .md files
  },
  
  {
    name: "get_anti_patterns",
    description: "What to avoid - mistakes, things Aslam hates",
    // Returns: core/anti-patterns.md
  },
  
  {
    name: "log_decision",
    description: "Record a decision made during this session",
    parameters: { 
      project: string, 
      decision: string, 
      reasoning: string 
    },
    // Appends to: memory/projects/[project]/decisions.md
  },
  
  {
    name: "log_lesson",
    description: "Record something learned during this session",
    parameters: { 
      project: string, 
      lesson: string, 
      context: string 
    },
    // Appends to: memory/projects/[project]/lessons.md
  }
]
```

---

## Example Files

### core/identity.md
```markdown
# Aslam — The Restless Vegapunk

## The Origin
A kid who once feared uncertainty, now a founder who quit without a safety net 
to build what Tanzania's education system desperately needs.

## The Mission
Solve African problems with technology that actually works here — 
offline-first, Swahili-native, built for reality not Silicon Valley fantasies.

## The Brands
- **ElimuAfrica** — AI education platform (the mission)
- **Apple Empire** — Phone retail + content (the business)
- **imaslam.com** — Brand strategy & design (the craft)

## The Philosophy
"Start with why, design with empathy, build with precision."

## The Influences
- One Piece (Vegapunk's endless innovation)
- Start With Why (Simon Sinek)
- Building a StoryBrand (Donald Miller)
- The reality of Tanzanian streets
```

### core/anti-patterns.md
```markdown
# Things I Refuse to Build

## Design Anti-Patterns
- Generic corporate speak ("synergy", "leverage", "solutions")
- Stock photo aesthetics
- Designs that ignore African context
- Cookie-cutter templates without soul

## Code Anti-Patterns
- Assuming reliable internet
- English-only interfaces for Swahili speakers
- Over-engineering simple problems
- Dependencies that don't work offline

## Strategy Anti-Patterns
- Brands without a real "why"
- Copying Western playbooks blindly
- Ignoring the human on the other side
- Promotional language over authentic storytelling
```

### patterns/code/offline-first.md
```markdown
# Offline-First Patterns

## Core Principle
Assume no internet. Treat connectivity as a bonus, not a requirement.

## Standard Stack
- Service Workers for caching
- IndexedDB for local storage
- Background sync when connection returns
- Optimistic UI updates

## ElimuAfrica Patterns
[specific code patterns used...]

## Sync Strategy
1. All writes go to local first
2. Queue operations for sync
3. Resolve conflicts with last-write-wins (for now)
4. Visual indicator of sync status
```

---

## How It Flows in Practice

### Starting a New Project

```
You: "Let's build a website for a safari company"

Claude Code (via MCP):
1. Calls get_identity() → Understands your philosophy
2. Calls get_market_context() → Tanzania tourism context
3. Calls get_patterns("design") → Your UI principles
4. Calls get_anti_patterns() → What to avoid
5. Calls get_project_context("makando-travel") → Similar past work

Result: Claude Code already knows you hate generic safari aesthetics,
prefer authentic storytelling, and have patterns from Makando Travel
it can reference.
```

### During Development

```
You: "I'm going to use a different animation approach here"

Claude Code:
1. Calls log_decision() → Records the choice + reasoning
2. Updates patterns if it's a new reusable pattern

Result: Next project, this decision is remembered.
```

---

## The Growth Loop

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Work on Project                                   │
│        │                                            │
│        ▼                                            │
│   Claude Code uses Punk Records                     │
│        │                                            │
│        ▼                                            │
│   Decisions & Lessons captured                      │
│        │                                            │
│        ▼                                            │
│   Punk Records grows smarter                        │
│        │                                            │
│        ▼                                            │
│   Next project starts with more context             │
│        │                                            │
│        └──────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up directory structure
- [ ] Write core identity files
- [ ] Basic MCP server with get_identity and get_patterns

### Phase 2: Memory (Week 2)
- [ ] Document 2-3 existing projects
- [ ] Add search_memory with basic keyword matching
- [ ] Add logging tools (log_decision, log_lesson)

### Phase 3: Intelligence (Week 3+)
- [ ] Semantic search using embeddings
- [ ] Auto-suggestions based on project type
- [ ] Pattern detection across projects

---

## Tech Stack for MCP Server

```
punk-records-mcp/
├── src/
│   ├── index.ts          # MCP server entry
│   ├── tools/            # Tool implementations
│   ├── search/           # Search functionality
│   └── storage/          # File system interactions
├── package.json
└── tsconfig.json

Dependencies:
- @modelcontextprotocol/sdk
- gray-matter (for markdown parsing)
- simple search or embedding model for semantic search
```

---

## The Punk Records Promise

Every time you open a project with Claude Code:
- It knows WHO you are
- It knows HOW you think  
- It knows WHAT you've built before
- It knows WHAT to avoid
- It grows smarter with every session

You're not starting from zero. You're continuing a conversation.


okay here's what i'm thinking, if we already have the mcp that's capable of growing with use, why then don't we make it even better when we're working on a specific project, the mcp should be keeping track of that project until the end. this means that once i start a new session claude should have all the past memory of what happened in the old sessions, it should literally be the mind with a memory of what it's been doing instead of always starting a new session fresh and re explaining everything 