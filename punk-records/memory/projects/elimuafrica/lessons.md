---
title: "ElimuAfrica Lessons"
domain: "memory"
tags: ["elimuafrica", "lessons", "learning", "mistakes"]
created: "2023-01-01"
updated: "2026-02-25"
---

# ElimuAfrica — Lessons Learned

### 2023-02-15 — Offline-first is harder than it sounds

**Lesson:** Offline-first architecture requires rethinking every feature from scratch, not retrofitting.

**Context:** Initially tried to add offline support to a traditional web app architecture. Had to restart with offline as the foundation, not a layer on top. Service Worker caching strategies are nuanced — static assets, API responses, and user data all need different approaches.

**Tags:** architecture, offline-first

---

### 2023-04-01 — 3D on low-end devices is tricky

**Lesson:** Three.js simulations that work on MacBook Pro fail on school computers and cheap Android phones.

**Context:** Built beautiful 3D labs that ran at 60fps on development hardware. On actual target devices, they were unusable. Had to implement aggressive LOD, simplified materials, and 2D fallbacks. Testing on actual target hardware from day one would have saved weeks.

**Tags:** performance, threejs, devices

---

### 2023-08-01 — Swahili content creation needs Swahili thinkers

**Lesson:** You can't just have English-speaking developers write Swahili content, even if they speak Swahili.

**Context:** Early content felt stilted because it was conceived in English and expressed in Swahili. The idioms, the examples, the way explanations flow — all need to originate in Swahili thinking. AI generation helps but needs Swahili-native review.

**Tags:** content, swahili, localization

---

### 2024-03-01 — AI-generated content needs guardrails, not just prompts

**Lesson:** Structured prompts reduce but don't eliminate errors in AI-generated educational content.

**Context:** Found that LLMs occasionally generate mathematically incorrect solutions, especially for multi-step problems. Need systematic validation — student outcome data as a lagging indicator, spot-checks as leading indicator. Can't rely on prompts alone.

**Tags:** ai, quality, content-generation

---

### 2026-02-25 — Toast notifications should follow the same "customer is the hero" principle as brand messaging. Students don't care about network state — they care about learning. Every toast should answer the question: "did the thing I just did work?" If the student didn't do anything, there should be no toast. System-noise toasts (offline indicators, loading failures, sync status) are the app talking about itself — remove them entirely and use persistent UI elements (badges, indicators) for background state.

**Lesson:** Toast notifications should follow the same "customer is the hero" principle as brand messaging. Students don't care about network state — they care about learning. Every toast should answer the question: "did the thing I just did work?" If the student didn't do anything, there should be no toast. System-noise toasts (offline indicators, loading failures, sync status) are the app talking about itself — remove them entirely and use persistent UI elements (badges, indicators) for background state.

**Context:** Audited 44 toast calls across 16 student-facing files. Found that 26/44 (59%) were system noise — network errors, offline mode indicators, sync status messages. These created an endless pile of toasts when offline, violating the offline-first philosophy. Removing them and relying on the OfflineIndicator badge creates a silent, invisible infrastructure that just works.

**Tags:** ux, offline-first, notifications, philosophy, student-experience

---

### 2026-02-25 — Offline-first means checking offline status BEFORE attempting network calls, not just having a fallback after timeout

**Lesson:** Offline-first means checking offline status BEFORE attempting network calls, not just having a fallback after timeout

**Context:** AdaptiveLessonPlayer had perfect offline fallback logic (load from IndexedDB) but it only ran after waiting 30-60s for network timeout. The right pattern: check navigator.onLine first, skip API entirely when offline. LessonSequencePlayer and NeuralTutorPlayer already did this correctly.

**Tags:** offline-first, network-timeout, ux, architecture-pattern

---
