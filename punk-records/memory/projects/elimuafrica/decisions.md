---
title: "ElimuAfrica Decisions"
domain: "memory"
tags: ["elimuafrica", "decisions", "architecture", "offline-first"]
created: "2023-01-01"
updated: "2026-02-17"
---

# ElimuAfrica — Decision Log

### 2023-01-15 — Offline-first architecture as foundation

**Decision:** Build ElimuAfrica as an offline-first PWA, not a traditional web app.

**Reasoning:** Most Tanzanian schools have intermittent or no internet. A cloud-dependent app would exclude the majority of our target users. Offline-first ensures the app works where students actually are.

**Tags:** architecture, offline-first, pwa

---

### 2023-03-01 — React + Three.js for virtual labs

**Decision:** Use React with Three.js (@react-three/fiber) for 3D educational simulations.

**Reasoning:** Science concepts like microscopy, circuits, and chemistry benefit enormously from interactive 3D visualization. R3F provides good React integration. Drei handles common patterns. Include 2D fallback for low-end devices.

**Tags:** tech-stack, threejs, education

---

### 2023-06-01 — Swahili-native content, not translation

**Decision:** Create all educational content natively in Swahili rather than translating English content.

**Reasoning:** Translation preserves English thinking patterns and assumptions. Swahili-native means concepts, examples, and cultural references that resonate with Tanzanian students. The 75% math failure rate is partly a language barrier.

**Tags:** content, swahili, localization

---

### 2024-01-01 — AI-powered lesson generation

**Decision:** Use LLMs for lesson and assessment generation with structured prompts and curriculum context.

**Reasoning:** Creating enough content manually for all subjects and levels is not feasible for a small team. AI generation with curriculum-aligned prompts can scale content creation while maintaining quality through structured output formats.

**Tags:** ai, content-generation, scaling

---
