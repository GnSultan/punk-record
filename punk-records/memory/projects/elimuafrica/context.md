---
title: "ElimuAfrica Context"
domain: "memory"
tags: ["elimuafrica", "education", "ai", "tanzania", "offline-first", "swahili", "mission"]
created: "2023-01-01"
updated: "2026-02-17"
---

# ElimuAfrica — AI-Powered Education That Works Where Students Are

**Status:** Active
**Tagline:** AI-powered education that works where students are

---

## The Why

**Problem:** 75% of Tanzanian students fail mathematics. The education system lacks teachers, resources, and modern tools.

**Mission:** Give every Tanzanian student access to quality, personalized education — regardless of internet access, language, or location.

**Personal stake:** This is why I quit. This is the cathedral.

---

## The What

**Platform type:** Federated offline-first AI education platform
**Version:** 1.6.7 (Feb 2026, active daily development)
**Status:** Production platform, not a prototype

**Architecture:** Three-server federated model
- **Master server** — LLM access (Claude, Gemini, OpenAI), content generation, ML training, analytics
- **Local school server** — Content delivery from cache, offline grading, real-time collaboration. No API keys needed.
- **Client** — React SPA, works with both servers, offline via PWA + IndexedDB

**Core Features (Actually Built):**
- Adaptive lesson player with ML-driven dynamic sequencing
- Neural tutor with MCTS lookahead planning and Bayesian knowledge tracking
- Quiz system (MCQ, true/false, short answer, fill-in-blank)
- NECTA prep with real past exam questions
- Personalized notes with whiteboard canvas and speech synthesis
- Remediation from wrong answers, spaced repetition (SM-2)
- 3D virtual laboratories (Three.js + React Three Fiber)
- Real-time whiteboards (Konva.js)
- Offline-first rubric-based grading (zero LLM cost)
- Teacher dashboard with analytics, alerts, lesson planning
- Three levels of admin (system, content, school)
- ML: Bayesian knowledge tracking, learner state inference, MCTS, student embeddings
- Pedagogy engine: misconception detection, scaffold builder, growth mindset messaging, Socratic prompts

**Target Users:**
- Form 4 secondary students in Tanzania (starting point)
- Teachers managing overcrowded classrooms
- Schools with limited or zero technology resources

---

## The How

**Tech Stack:**
- Frontend: React 19, Vite 7, TailwindCSS 4, Three.js, Konva.js, Framer Motion, Zustand
- Backend: Express 4, TypeScript, Prisma + PostgreSQL, ChromaDB, Redis, Socket.IO
- ML: TensorFlow.js, ONNX Runtime
- LLMs: Claude, Gemini, OpenAI (master server only)
- TTS: Google Cloud Text-to-Speech
- Offline: IndexedDB, Service Workers, PWA, local @fontsource fonts
- Infrastructure: Docker Compose, Cloudflare Tunnel

**Key Patterns Used:**
- Federated server architecture (master + school servers)
- Offline-first with server discovery (local first, master fallback)
- ML-driven adaptive sequencing (not rules-based)
- Zero-LLM-cost grading (rubric-based offline)
- Content atoms as smallest learning units

---

## Key Insights

- The 75% failure rate isn't just about math — it's about access, language, and the gap between how education is delivered and how students actually learn
- Offline-first is the foundation, not a feature. Without it, you're building for Dar es Salaam elites, not Tanzanian students
- Swahili-native content creation is fundamentally different from translation — the concepts, examples, and flow must originate in Swahili
- 3D simulations work brilliantly for spatial concepts (science labs, geometry) but are overkill for text-heavy subjects
- AI lesson generation is promising but quality control at scale remains an open question

---

## Active Tensions

**Cathedral vs. Speed:** ElimuAfrica is architecturally ambitious. At some point, real students need to use it, even if imperfect. When does vision become procrastination?

**Building Alone vs. Scaling Impact:** The mission requires scale. Scale requires people. People require trust and handoffs. How do you grow without losing the coherence?

---

## The Ecosystem

ElimuAfrica isn't one project — it's a constellation of connected efforts:

### The Platform
The core product. Offline-first AI education with lesson generation, auto-marking, 3D labs, whiteboards, Swahili-native content. This is the thing being built.

### Elimu Community Light (ECOLI)
The NGO side. Community development organization focused on ECD, education access, and livelihoods. Brand identity designed by Aslam through Pulse Brand Studio. See: `memory/clients/elimu-community-light/brand.md`

### Narrative Engine
Autonomous content system for Aslam's personal LinkedIn, building an audience of believers BEFORE the platform launches. Uses the Vegapunk architecture — multiple AI personas sharing one brain, each expressing the education crisis story in different voices. The pre-launch strategy: establish the problem, explore the philosophy, hint at the mechanism, then reveal ElimuAfrica as the solution. See: `memory/projects/narrative-engine/context.md`

### ElimuAfrica Brand Identity
The platform's own brand system — voice-driven, data-as-storytelling, "African, Not Apologetic" positioning. See: `memory/projects/elimuafrica/brand.md`

All four pieces serve the same mission from different angles: the platform delivers the education, the NGO does community work, the narrative engine builds awareness, and the brand identity ensures everything speaks with one coherent voice.
