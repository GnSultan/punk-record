---
title: "Narrative Engine Context"
domain: "memory"
tags: ["narrative-engine", "vegapunk", "multi-agent", "consciousness", "linkedin", "content", "elimu", "punks", "autonomous"]
created: "2025-01-01"
updated: "2026-02-17"
---

# Narrative Engine — Distributed Consciousness Content System

**Status:** Built, in early operational phase
**Location:** `/Users/macbook/narrative-engine/`
**Purpose:** Autonomous LinkedIn content generation for Aslam's personal profile — building an audience of believers before ElimuAfrica launches

---

## What This Is

The Narrative Engine is the first real implementation of the Vegapunk theory. Not a content scheduler — a multi-agent AI consciousness system where multiple personas ("punks") share one central brain and express the same truth in completely different voices across different channels.

Initially conceived for Elimu Community Light's LinkedIn, but evolved to serve Aslam's personal LinkedIn profile. The system's job: build audience awareness and understanding of the Tanzanian education crisis BEFORE ElimuAfrica launches. Establish the problem, explore the philosophy, hint at the mechanism, then reveal the solution.

---

## The Vegapunk Architecture

Inspired by Dr. Vegapunk from One Piece — one mind, multiple bodies, each with specialized personality and expertise.

### Shared Substrate (Central Brain)
- **Knowledge Graph** — semantic relationships between all concepts
- **Evidence Store** — every factual claim backed by sources with credibility scores
- **Consciousness State** — deep mood, beliefs, learning (shared emotional substrate)
- **Memory Tiers** — working (immediate), consolidated (reliable), deep (foundational)
- **Identity Foundation** — Elimu's mission, values, boundaries

### Per-Punk Expression Layer
Each punk has independent:
- **Voice profile** — tone, vocabulary, style
- **Persona** — character, background, beliefs
- **Goals** — different targets per punk
- **Channel config** — LinkedIn, Twitter, website, codebase
- **Metabolic rate** — different heartbeat intervals

### The Punks

| Punk | Channel | Voice | Example |
|------|---------|-------|---------|
| **Maya** | LinkedIn | Professional, measured, credible, grounded | "Tanzania's 1:50 teacher-student ratio demands systemic intervention" |
| **X-Punk** | Twitter/raw | Edgy, provocative, contrarian | "60 kids per class? Teachers are babysitters, not educators" |
| **Code-Observer** | Technical | Analytical, research-focused | "[Data] Tanzanian secondary schools average 62:1 ratio vs. OECD 13:1" |
| **Website-Punk** | Long-form | Essays, deep dives | Extended exploration of a single concept |

All grounded in the same research. Completely different impact.

---

## How It Works

### Behavioral Autonomy (Not Scheduling)
No fixed "post Monday at 9am." Action emerges organically:
- **Discomfort detector** — identifies pain signals (3 days of silence, engagement drop, opportunity gap)
- **Impulse engine** — generates urges to act (emotional, social, goal-driven)
- **Rhythm keeper** — maintains pace (each punk has different metabolic rate)
- **Result:** Organic posting that hits targets without forcing

### Generation Pipeline
1. **Strategic reasoning** — what should we write about? (checks news, engagement, narrative phase)
2. **Knowledge assembly** — what do we know? (search knowledge graph, retrieve evidence, verify credibility)
3. **Prompt construction** — apply punk voice + shared identity + channel affordances
4. **LLM generation** — Claude API creates draft
5. **Self-critique loop** — score against 9 criteria, iterate until score > 75
6. **Human approval** — never auto-publishes, absolute requirement
7. **Publishing** — post to channel, store metadata
8. **Learning** — track engagement, analyze patterns, update adaptive parameters

### Consciousness System (3 Unified Modules)
1. **Deep Mood** — emotional core (energy, confidence, anxiety, excitement). Updates with every action and outcome.
2. **Post Decision** — strategic thinking before action. "Should I generate content now?" considering mood, recent posts, engagement, goals.
3. **Social Imagination** — simulates how audience will perceive content before publishing. Learns from actual engagement to refine the model.

### Learning System
- **Edit learning** — tracks human corrections to improve over time
- **Engagement learning** — analyzes what resonates and why
- **Adaptive parameters** — self-tuning thresholds based on evidence
- **Confidence tracking** — knows what it's unsure about
- **Pattern discovery** — "Teacher stories work better than statistics"

---

## Evidence & Credibility

Every claim flows through a credibility loop:
1. **Research document** → "Teacher ratio 1:50 in Tanzania" (with source)
2. **Vision/intent** → "We should build AI for teachers" (grounded in evidence)
3. **Codebase** → "TeacherDashboard service exists" (proof of building)
4. **Verification** → Code compiles, tests pass

Before making any claim: "Is this in the credibility registry?" If yes, state confidently with evidence. If no, hedge or avoid.

---

## Narrative Arc

The engine is executing a deliberate narrative strategy:

| Phase | Focus | Status |
|-------|-------|--------|
| 1. Problem Establishment | Education crisis is real and urgent | Current |
| 2. Philosophy | Why this matters, what human-centered education looks like | Current |
| 3. Mechanism | How can AI help? (hint, don't reveal) | Upcoming |
| 4. Building Reveal | Tease what's coming | Future |
| 5. Launch | Reveal ElimuAfrica | Future |

Each phase has **whatToReveal** and **whatToHoldBack** — careful information control so the narrative builds tension.

---

## Tech Stack

- **Runtime:** Node.js 20+ (TypeScript)
- **Database:** PostgreSQL (Supabase) + ChromaDB (vectors)
- **ORM:** Prisma
- **LLMs:** Claude (primary), OpenAI (fallback), Ollama (offline)
- **Frontend:** React 19, Tailwind, Zustand, Vite
- **Integrations:** LinkedIn API, Telegram (grammy), Resend (email)
- **Jobs:** pg-boss, node-cron
- **Logging:** Winston

---

## Core Design Principles

1. **One Brain, Many Voices** — shared knowledge, independent expression. Emotional contagion between punks.
2. **Never Auto-Publish** — all content requires human approval. Absolute safety gate.
3. **Behavioral Autonomy** — impulse-driven, not scheduled. Organic pacing.
4. **Learning is Central** — every edit, every engagement teaches. Three-tier memory.
5. **Evidence Matters** — credibility loops. Transparent about know vs. believe vs. uncertain.
6. **Human Partnership** — AI augments human judgment, never replaces it.

---

## Connection to the Larger Vision

The Narrative Engine is the **first implementation** of the Vegapunk theory. Punk Records MCP server is the **second** — same core idea (central knowledge, specialized tools accessing it) but implemented as an MCP server for Claude Code rather than autonomous agents.

Both share the same DNA:
- Central knowledge base that grows smarter over time
- Specialized interfaces for different purposes
- Human always in the loop
- Learning from every interaction

The difference: Narrative Engine has autonomous behavioral loops (it decides when to act). Punk Records MCP is reactive (responds when Claude Code queries it). Two expressions of the same theory.

---

## Knowledge Sources Ingested

- 22 chat histories (169MB) — development reasoning and decisions
- Research documents — Tanzanian education statistics, teacher crisis data
- Vision documents — ElimuAfrica intent and philosophy
- Codebase features — actual implementation proof
