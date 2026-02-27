---
title: "lessons"
created: "2026-02-22"
updated: "2026-02-23"
---

# lessons

### 2026-02-22 — When using IPC event listeners with promises, cleanup timing is critical. If you cleanup in finally block, you may remove the listener before final events arrive from the backend.

**Lesson:** When using IPC event listeners with promises, cleanup timing is critical. If you cleanup in finally block, you may remove the listener before final events arrive from the backend.

**Context:** Electron IPC pattern: backend sends multiple events (processStarted, message, processEnded) over time, but invoke() promise resolves when backend function returns. If you cleanup listener when promise resolves, you miss the final events that were queued but not yet delivered.

**Tags:** electron, ipc, event-listeners, async-patterns

---

### 2026-02-22 — When building features, check user's core identity first before following standard patterns. Generic IDE answer = split terminal. Aslam's answer = full switch. The difference comes from values (depth over breadth) not technical constraints.

**Lesson:** When building features, check user's core identity first before following standard patterns. Generic IDE answer = split terminal. Aslam's answer = full switch. The difference comes from values (depth over breadth) not technical constraints.

**Context:** Initially suggested standard IDE features (split panes, quick actions, etc). User pushed back: "you're thinking like everybody else... who am I?" Checked identity → depth over breadth, focus, authenticity. This led to the correct design: full workspace terminal switch, not generic split pane.

**Tags:** design, philosophy, user-identity

---

### 2026-02-22 — The delete_file handler was using fs.promises.rm with recursive:true and force:true, which caused a single file deletion to wipe the entire project folder. The fix required AppleScript to move files to Trash instead of permanent deletion.

**Lesson:** The delete_file handler was using fs.promises.rm with recursive:true and force:true, which caused a single file deletion to wipe the entire project folder. The fix required AppleScript to move files to Trash instead of permanent deletion.

**Context:** User tried to delete a single file through Pane and lost the entire project folder. The built app bundle (app.asar) still had the old dangerous deletion code even though notes.md claimed it was fixed. Recovered by extracting source from app.asar, patching the deletion handler, and rebuilding.

**Tags:** bug, data-loss, electron, file-operations, macos

---

### 2026-02-22 — The notes.md file is a complete session memory - it shows the entire evolution from Tauri to Electron, including: CodeMirror→React Ace migration with quality-focused reasoning, terminal mode as full workspace switch (not split pane), git enhancement with Changes/History tabs, todo panel integration from Claude Code's TodoWrite, and the critical deletion bug that we just fixed again.

**Lesson:** The notes.md file is a complete session memory - it shows the entire evolution from Tauri to Electron, including: CodeMirror→React Ace migration with quality-focused reasoning, terminal mode as full workspace switch (not split pane), git enhancement with Changes/History tabs, todo panel integration from Claude Code's TodoWrite, and the critical deletion bug that we just fixed again.

**Context:** notes.md captured the conversation flow from lines 1-2314, showing decision-making process, failed attempts, corrections, and final implementations. This is invaluable for reconstruction - it's not just code, it's the WHY behind every change.

**Tags:** recovery, documentation, session-memory

---

### 2026-02-22 — Rushing implementation without thoroughly reading session notes leads to mismatched features, broken functionality, and wasted time. Must read full conversation context to understand decisions and implementation details

**Lesson:** Rushing implementation without thoroughly reading session notes leads to mismatched features, broken functionality, and wasted time. Must read full conversation context to understand decisions and implementation details

**Context:** Rebuilt Pane features from notes.md after deletion bug. Initially rushed and missed critical details like: Ace theme in globals.css not separate file, controlled vs uncontrolled mode lag, FileTree race condition, proper understanding of what was actually built

**Tags:** lesson, process, quality

---

### 2026-02-22 — Performance feel (60fps) was critical enough to drive architectural decisions including Tauri→Electron migration

**Lesson:** Performance feel (60fps) was critical enough to drive architectural decisions including Tauri→Electron migration

**Context:** User emphasized 60fps vs 30fps feel repeatedly in notes.md (lines 747-935). The migration from Tauri to Electron wasn't just about features - it was specifically because Tauri didn't support 120Hz ProMotion displays on Apple silicon MacBooks. This smoothness/responsiveness is core to Pane's "light, speed, fast building minimal environment" philosophy. Notes show extensive work removing ALL CSS transitions to achieve instant feedback.

**Tags:** performance, ux, architecture, tauri, electron, 120hz, promotion

---

### 2026-02-23 — The notes.md file is a complete development journal of building Pane from initial state to polished IDE. It covers: project removal bug (pointer events), catastrophic delete bug (rm_dir_all → trash), 3-iteration scroll fix, editor race conditions, processing stuck state, typing lag (controlled→uncontrolled), zero-CSS-transitions policy, monochromatic syntax, React Ace migration, terminal as full workspace switch, TodoPanel with pulsing dots, enhanced git with commit/push/pull, theme system (Ink/Paper/Pure), and the philosophical correction that Pane is about focus not features.

**Lesson:** The notes.md file is a complete development journal of building Pane from initial state to polished IDE. It covers: project removal bug (pointer events), catastrophic delete bug (rm_dir_all → trash), 3-iteration scroll fix, editor race conditions, processing stuck state, typing lag (controlled→uncontrolled), zero-CSS-transitions policy, monochromatic syntax, React Ace migration, terminal as full workspace switch, TodoPanel with pulsing dots, enhanced git with commit/push/pull, theme system (Ink/Paper/Pure), and the philosophical correction that Pane is about focus not features.

**Context:** User asked to study notes.md thoroughly to understand every design choice and compare with current implementation. The notes represent a lost development session that needs to be reconstructed.

**Tags:** notes-analysis, lost-session, reconstruction, design-decisions, bugs, performance

---

### 2026-02-23 — Terminal UI should follow the same pattern as conversation UI - scrollable output at top, input at bottom. The $ prompt must be aligned WITH the command input, not separate. Shortcuts only shown when terminal is empty and centered. No xterm.js dependency needed.

**Lesson:** Terminal UI should follow the same pattern as conversation UI - scrollable output at top, input at bottom. The $ prompt must be aligned WITH the command input, not separate. Shortcuts only shown when terminal is empty and centered. No xterm.js dependency needed.

**Context:** After multiple design iterations, learned that Pane's minimal design philosophy requires: (1) input areas focused on input only, (2) visual elements unified not separated, (3) consistency across all modes (conversation/viewer/terminal), (4) custom implementation over generic libraries

**Tags:** design, terminal, ui-patterns, minimal

---
