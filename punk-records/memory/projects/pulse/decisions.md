---
title: "pulse Decisions"
domain: "memory"
tags: ["pulse", "decisions"]
auto_generated: true
updated: "2026-02-28"
---

# pulse — Decisions

*Auto-maintained from session timeline. Each decision captures what was chosen and why.*

---

### 2026-02-26 — Rebuild Mirror Engine from scratch using deterministic consciousness learnings - 3-day sprint to ship

**Why:** Mirror Engine as originally built has same LLM-heavy architecture as Narrative Engine v1. Need clients urgently. Apply v2 learnings from the start: deterministic logic for behavioral intelligence, LLM only for creative/strategic work.

---

### 2026-02-26 — Named the outreach system 'Pulse' - reclaiming the name from the old agency, now with real substance behind it

**Why:** Pulse Brand Studio was abandoned because it felt misleading for one person. Now building an actual intelligent system that checks a company's pulse - diagnoses their positioning health. The name finally has substance worthy of it.

---

### 2026-02-26 — Email infrastructure: Resend API for sending, Gmail for inbox, Cloudflare for custom domain email. Primary goal: inbox placement, not spam/promotions.

**Why:** Resend has excellent deliverability, proper DKIM/SPF/DMARC out of the box with Cloudflare domains. Gmail inbox is where replies land. The entire system must produce emails indistinguishable from hand-written personal correspondence.

---

### 2026-02-26 — Follow-up sequence is 3 emails max, not infinite. Door Close (email 3) works by giving permission to say no, which paradoxically increases replies.

**Why:** Principle 8 says 'Persistence Without Intelligence Is Spam.' Three emails with escalating specificity is the sweet spot. Email 1 = mirror (the diagnosis). Email 2 = evidence (deeper finding, 80-100 words, new value). Email 3 = door close (30-50 words, permission to say no). More than 3 burns the relationship. Fewer than 3 leaves money on the table — 80% of replies come from follow-ups.

---

### 2026-02-26 — Pulse must be autonomous — not a CLI tool. Build heartbeat loop that runs research, synthesis, follow-ups, and sends without manual commands. Add Google search for deeper research beyond scraping.

**Why:** Aslam's pattern is building autonomous systems (Narrative Engine heartbeat). A CLI tool requiring 6 manual commands contradicts his identity. He needs systems that work while he builds ElimuAfrica. The Narrative Engine v2 deterministic consciousness is the blueprint: math for behavioral decisions, LLM only for creative work.

---

### 2026-02-26 — Migrate Pulse from @google/generative-ai (deprecated Dec 2025) to @google/genai. Use Gemini's built-in Google Search grounding for prospect research instead of adding Tavily.

**Why:** Same API key, no new costs, no new dependencies. Search grounding lets Gemini find reviews, social media, news articles about the prospect during research. The older SDK is archived and read-only.

---

### 2026-02-26 — Auto-approve threshold set at 85/100 critique score. Drafts at or above this score are sent autonomously. Below 85 requires manual review. This balances quality (the critique system already enforces standards) with autonomy (Aslam doesn't want to click things).

**Why:** 85 is the sweet spot — the critique system already filters hard (specificity, voice, length, differentiation quality). If a draft passes at 85+, it's genuinely good. Below that, human eyes catch what the critic missed.

---

### 2026-02-26 — Switching Pulse's creative LLM from Gemini to Claude. Claude for all writing (email synthesis, critique, follow-ups) — its voice is more direct, more specific, more human, closer to Aslam's actual tone. Keeping Gemini ONLY for Google Search grounding (deep research) since that's a unique capability Claude doesn't have.

**Why:** Emails are the product. Gemini writes like a helpful assistant. Claude writes like a person with opinions. Aslam's brand voice is direct, sharp, no filler — Claude matches that better.

---

### 2026-02-26 — Built Pulse world model with 4 layers: knowledge graph (nodes + edges + memory tiers), prospect memory (structured profiles), industry memory (sector intelligence), market memory (cross-company patterns). Adapted Narrative Engine's architecture for outreach context.

**Why:** User challenged that Pulse processes companies but doesn't KNOW them. Referenced Narrative Engine's knowledge graph and memory tiers as the standard.

**Alternatives considered:** Considered porting Narrative Engine's Prisma/Postgres/ChromaDB stack directly, rejected because Pulse is SQLite-based and should stay lightweight

---

### 2026-02-26 — Made pickRelevantExpertise() in brain.ts a legacy fallback rather than removing it. The function still works but is no longer called from generator.ts or critique.ts — those now use getGraphExpertise() directly. This means the markdown files still load into BrainContext but are only used if no expertise_pattern nodes exist in the graph (e.g., fresh install before first world model cycle).

**Why:** Graceful degradation — if graph is empty, static expertise still works. Once seeded, graph takes over automatically.

---

### 2026-02-26 — Adding semantic embeddings to Pulse's knowledge graph using Gemini's gemini-embedding-001 model. Free tier, @google/genai already installed. Using 256-dimension vectors (not default 3072) to keep SQLite storage reasonable. Stored as JSON text in a new embedding column. Cosine similarity computed in JS. Replaces keyword-based findSimilarNodes() with semantic search. Also upgrades expertise classifier and emergent pattern detection.

**Why:** Keyword matching misses synonyms. Semantic similarity catches 'overlapping messaging' = 'shared phrases'. Free API, already installed.

---

### 2026-02-27 — ESLint rules: all warnings promoted to errors, matching Development Principles pattern

**Why:** Punk Records Development Principles pattern says: 'No any types ever. No warnings, only errors. No eslint-disable comments.' Previous setup had no linter at all — 97 violations accumulated silently. Now enforced: no-explicit-any, no-floating-promises, no-misused-promises, require-await, no-unnecessary-type-assertion, eqeqeq, prefer-const, no-var.

**Alternatives considered:** Could have used warn for any-types to ease migration — rejected because the pattern explicitly forbids warnings

---

### 2026-02-27 — Added contacts table alongside prospects rather than restructuring prospects. Contacts are the address book, prospects are outreach targets. A contact gets promoted to prospect via quality threshold (0.6+). This preserves all 15+ files that depend on the prospects table.

**Why:** prospects table is wired into orchestrator, delivery, conversations, memory, synthesis — restructuring would touch 15+ files for no gain. CRM lead-vs-opportunity pattern is cleaner.

---

### 2026-02-27 — Chose SQLite table polling (2s interval) over direct HTTP posting for heartbeat-to-dashboard communication. Zero coupling between processes, WAL handles concurrent access, events accumulate when dashboard is down.

**Why:** Simplest, most decoupled. Heartbeat doesn't need to know dashboard exists.

**Alternatives considered:** Direct HTTP post (tighter coupling), file watching (fragile), SQLite update_hook (same-process only)

---

### 2026-02-27 — Dashboard redesign plan: kill 7 tabs, use overview-dominant layout with 3 views + 4 detail panels. Clash Grotesk self-hosted for display, Inter via @fontsource for body. [data-theme] CSS variable architecture for light/dark. ElimuAfrica-style max-w-6xl constrained layout with 2/3+1/3 grid. Staggered Framer Motion entrances. Bordered rounded-2xl cards.

**Why:** Current dashboard uses generic tabs, no theme support, CDN fonts, edge-to-edge layout — none of which match Aslam's actual design patterns from portfolio and ElimuAfrica

**Alternatives considered:** Floating sidebar (overkill for solo tool), pure monochromatic (hard to scan data), Poppins font (ElimuAfrica-specific, not personal brand)

---

### 2026-02-27 — Updated dark theme palette from Tailwind gray-900 series (#111827/#1F2937) to portfolio-matching flat dark (#0F0F0F/#1A1A1A/#2A2A2A). Secondary text changed from #9CA3AF to #B0B0B0, tertiary from #6B7280 to #666666.

**Why:** Aslam's portfolio uses #0F0F0F bg with #2A2A2A surfaces — much darker and flatter than Tailwind gray-900 palette. The original dark theme looked too blue-gray, not matching his actual aesthetic.

**Alternatives considered:** Could have used ElimuAfrica's #111827 palette but portfolio palette is more 'him' — it's the personal brand site.

---

### 2026-02-27 — Designed 5-phase transformation plan to evolve Pulse from pipeline to brain: (1) Close learning loop - wire existing disconnected systems, (2) Prospect empathy model - make prospect the hero, (3) Multi-angle strategy - 6 engagement approaches instead of 1, (4) Behavioral intelligence - cross-pollinate Narrative Engine v2 deterministic consciousness, (5) Dynamic critique + channel awareness. Zero new LLM calls in phases 1, 2, 4. Only 5 new files. Mostly wiring existing infrastructure.

**Why:** Pulse operates as a mechanical pipeline, not a brain. World model doesn't learn. Emails diagnose AT prospects instead of empathizing WITH them. Single engagement approach. Timer-driven instead of signal-driven. Philosophy demands: prospect as hero, authenticity, empathy.

**Alternatives considered:** Could have done a full rewrite, but existing architecture is sound — just disconnected. Could have added more LLM calls for intelligence, but deterministic approach is cheaper and more debuggable.

---

### 2026-02-27 — Follow-up retry loop uses MAX_FOLLOWUP_ATTEMPTS=2 (not 3 like email #1). Follow-ups are shorter/simpler, so less value in a 3rd retry. Reduces LLM cost while still catching gate failures.

**Why:** Follow-ups are 80-100 words (position 2) or 30-50 words (position 3). Two attempts with critique feedback is enough — the third attempt for email #1 helps because those emails are more complex (150-250 words).

**Alternatives considered:** 3 attempts like email #1, 1 attempt (status quo)

---

