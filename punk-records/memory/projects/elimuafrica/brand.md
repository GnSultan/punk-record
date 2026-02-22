---
title: "ElimuAfrica Brand Identity System"
domain: "memory"
tags: ["elimuafrica", "brand", "identity", "edtech", "education", "africa", "offline-first", "ai", "inter", "poppins"]
created: "2026-02-01"
updated: "2026-02-17"
---

# ElimuAfrica Brand Identity System

## This Is Aslam's Platform

ElimuAfrica is not a client project. This is the thing he quit his comfort zone to build. The focus right now is building what matters — the product, the ML, the pedagogy, the offline architecture. The brand identity as a deliberate project hasn't happened yet.

What exists below is a mix of: brand strategy that emerged naturally through building, visual choices made for functional reasons (not brand reasons), and the brand identity system PDF which captures the voice and positioning but not a designed visual system.

**When the time comes to do a proper brand identity, the strategy foundation is already strong. The visuals will follow the same process as every other brand — derived from strategy, not chosen arbitrarily.**

**Current state:** Version 1.6.7 (Feb 2026), active daily development. Production platform.

## The Origin Story

In Tanzania, a 19-year-old watched his community struggle under a system never designed for them. Classrooms of 80 students. One overwhelmed teacher. No internet. No labs. No resources. Students falling behind not because they lacked intelligence, but because the system lacked capacity to see them as individuals.

The question was never "Is there a market for this?" The question was: "What can we build right now, with what we have, that changes this?"

## Why the Name

**Elimu** is Swahili for education — rooting it in African language and identity.
**Africa** declares scope and ambition.

Together, they sound inevitable. Not clever. Not trendy. Just right. When you hear "ElimuAfrica," your instinct is: "How is this not already a thing?"

ElimuAfrica is not a description of a product. It is a declaration of a commitment.

## What's Actually Built

### Architecture: Three-Server Federated Model
Not a simple web app. A federated system designed for African infrastructure reality:

1. **Master Server** — LLM access (Claude, Gemini, OpenAI), content generation, ML model training, analytics aggregation
2. **Local School Server** — Content delivery from cache, offline grading, real-time collaboration, data collection. No API keys needed — proxies through master when connected.
3. **Client** — React SPA, works with both servers, role-based (student, teacher, school admin, content admin, system admin), offline-capable via PWA + IndexedDB

**Server discovery:** Tries local server first (lower latency, offline), falls back to master (full features). Offline is the default, connection is the opportunity.

### Student Learning (45+ pages)
- Adaptive lesson player with ML-driven dynamic sequencing
- Neural tutor with MCTS lookahead planning and Bayesian knowledge tracking
- Quiz system (MCQ, true/false, short answer, fill-in-blank)
- NECTA prep with real past exam questions (Tanzania national exams)
- Personalized notes with whiteboard canvas and speech synthesis
- Remediation — targeted learning from wrong answers
- Spaced repetition (SM-2 algorithm) for mastery
- Practice sessions with instant offline grading

### Teacher Tools
- Dashboard with class performance analytics
- Individual student progress tracking with at-risk alerts
- Lesson planning and class-aware assignment
- Assignment distribution hub

### Admin (Three Levels)
- System admin: AI services, analytics, audit logs, ML training, crons
- Content admin: Studio, atom library, curriculum manager, content issues
- School admin: Class management, student registry, teacher assignment

### Machine Learning (Actually Running)
- Bayesian knowledge tracking per student
- Learner state inference (CURIOUS, STRUGGLING, FLOWING, FATIGUED)
- MCTS (Monte Carlo Tree Search) — 5+ step lookahead for lesson sequencing
- Student embeddings for personalization
- Preference learning from interaction patterns

### Pedagogy Engine
- Misconception detection from wrong answer patterns
- Remediation path generation (concept gaps to targeted content)
- Scaffold builder (hints, worked examples, visual aids that fade out)
- Growth mindset messaging (Dweck-based)
- Socratic discussion prompt generation
- Enrichment recommendations

### Grading
- Offline-first rubric-based grading (zero LLM cost)
- Answer validation with semantic similarity fallback
- Auto-grading with teacher review queue

## Mission & Vision

**Mission:** To deliver world-class, personalized education to every African student — offline, in their language, on their terms — by building AI-powered tools that free teachers to teach and empower students to learn at their own pace.

**Vision:** A continent where every student has access to brilliant, personalized education — regardless of geography, infrastructure, or economic circumstance.

## Core Values

1. **Education Is a Right, Not a Privilege** — If a feature requires reliable internet, it is not ready. If a tool only works in English, it is not finished.
2. **African Solutions for African Problems** — Built from the ground up for African curricula, languages, infrastructure realities, and student needs.
3. **Teachers Are Sacred** — AI handles grading, planning, administrative burden. Teachers handle mentorship, inspiration, creativity, connection.
4. **Offline First, Always** — 40% of Tanzanian schools have zero technological devices. Every feature must work offline. No exceptions.
5. **Start Now, Not Someday** — Build with what we have, iterate with what we learn, ship what works.
6. **Maximum Realism, Maximum Respect** — Students are smarter than most think. Interactive 3D labs, realistic simulations, genuine learning experiences.

## Visual Choices (Functional, Not Brand-Designed Yet)

### Logo
Custom SVG wordmark — `elimuafrica.svg` embedded in the app. Auto-adapts to dark/light mode. Available in sizes sm/md/lg/xl.

### Color System (Tailwind Config)

| Name | Hex | Meaning | Usage |
|------|-----|---------|-------|
| Primary Blue | #3b82f6 | Trust & Focus | Primary actions, links, active states |
| Secondary Green | #10b981 | Growth & Success | Success states, progress, achievements |
| Accent Purple | #8b5cf6 | Creativity | Creative elements, highlights |
| Success | semantic green | Achievement | Quiz correct, completion |
| Warning | semantic amber | Attention | At-risk alerts, caution |
| Danger/Error | semantic red | Problem | Errors, failed states |
| Info | semantic blue | Information | Guidance, tooltips |

**Not monochromatic.** This is a learning platform — color serves pedagogy. Blue for trust and focus, green for growth feedback, purple for creative exploration. Each color communicates something to the student.

### Typography (Actual Font Stack)

| Font | Role | Why |
|------|------|-----|
| **Inter** | Body text, UI, default sans | Clean readability on all devices and screen sizes |
| **Poppins** | Display headings | Friendly geometry, approachable authority |
| **Caveat** | Handwriting style | Student-facing interactive content, warmth |
| **Patrick Hand** | Handwriting alt | Notes, informal student content |
| **Kalam** | Handwriting alt | Whiteboard, canvas elements |

**Key insight:** Three handwriting fonts for student-facing content. This is deliberate — a learning platform needs to feel human, not corporate. The handwriting fonts appear in interactive spaces (whiteboard, notes, personalized content) while Inter and Poppins handle the structural UI.

**All fonts loaded locally via @fontsource** — offline-first extends to typography. No Google Fonts CDN dependency.

### Meta Identity
- **App title:** "Elimu AI - Adaptive Learning Platform"
- **Description:** "AI-powered personalized education for Tanzanian students. Learn offline, anytime, anywhere."
- **PWA name:** "Elimu AI"
- **Theme color:** #4f46e5 (indigo)

## Tech Stack (Production)

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TailwindCSS 4 |
| 3D | Three.js + React Three Fiber |
| Whiteboard | Konva.js + React Konva |
| Animation | Framer Motion |
| State | Zustand |
| Data | TanStack React Query |
| Math | KaTeX |
| Real-time | Socket.IO |
| Backend | Express 4, TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Vectors | ChromaDB |
| Cache | Redis |
| LLMs | Claude, Gemini, OpenAI |
| ML | TensorFlow.js, ONNX Runtime |
| TTS | Google Cloud Text-to-Speech |
| Offline | IndexedDB, Service Workers, PWA |
| Infrastructure | Docker Compose, Cloudflare Tunnel |

## Brand Positioning

**Statement:** For African students and teachers who are underserved by existing education infrastructure, ElimuAfrica is the offline-first adaptive education platform that delivers personalized, curriculum-aligned learning in local languages. Unlike imported EdTech solutions that require reliable internet and teach in English, ElimuAfrica was built in Africa, for Africa, with the constraints of African infrastructure baked into every design decision.

**The One-Liner:** "We build offline-first AI education for African students. Every student deserves brilliant teaching, whether they're in a city or a village with no internet."

**Tagline:** "Education. Africa. Now."

## Voice & Language Rules

| We Say | We Never Say |
|--------|-------------|
| "Infrastructure that uses AI" | "AI company doing education" |
| "Built in Africa, for Africa" | "Bringing technology to Africa" |
| "Freeing teachers to teach" | "Replacing teachers with AI" |
| "Students who are underserved" | "Underprivileged students" |
| "African solutions" | "Developing world solutions" |
| "Our students are brilliant" | "Helping poor students" |
| "Works offline, works everywhere" | "Despite limited infrastructure" |

## The Problem (Brand Narrative Data)

| Stat | Value |
|------|-------|
| Average students per class | 70 |
| Pupil-to-qualified-teacher ratio | 131:1 |
| Students failing mathematics | 75% |
| Teacher starting salary | $170–$327/month |
| Teachers leaving annually | 3,673 |
| Secondary completion rate | <30% |
| Rural secondary completion | ~15% |
| Secondary dropouts (2022) | 136,313 |
| Schools with zero tech devices | 40% |

## Brand Assets

- Logo SVG: embedded in client codebase (`client/src/components/ElimuLogo`)
- Brand identity system PDF: `/Users/macbook/Downloads/ElimuAfrica-Brand-Identity-System.pdf`
- Codebase: `/Users/macbook/elimuafrica/`
- Repository: `https://github.com/GnSultan/elimu-ai-platform`
