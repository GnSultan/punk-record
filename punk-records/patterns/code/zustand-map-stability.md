---
title: "zustand-map-stability"
domain: "patterns/code"
tags: ["zustand","react","performance","electron","pane"]
created: "2026-02-23"
updated: "2026-02-23"
---

# Zustand Map Store — Reference Stability

## The Problem
When using `Map<string, Object>` in Zustand, `updateProject()` creates `new Map(old)` + `{ ...project, ...updates }` on every call. This means:

1. **Every `.get()` returns a new object reference** — even if only one field changed
2. **The Map itself is a new reference** — `s.projects !== previousProjects` always
3. During streaming, this fires 50+ times/sec causing cascading re-renders

## The Rules

### NEVER do this (returns full object — re-renders on every store update):
```tsx
const project = useProjectsStore((s) => s.projects.get(id));
const conversation = useProjectsStore((s) => s.projects.get(id)?.conversation);
```

### DO this — return primitives:
```tsx
const mode = useProjectsStore((s) => s.projects.get(id)?.mode ?? "conversation");
const isProcessing = useProjectsStore((s) => s.projects.get(id)?.conversation.isProcessing ?? false);
const root = useProjectsStore((s) => s.projects.get(id)?.root);
```

### For arrays/objects you genuinely need — useShallow:
```tsx
import { useShallow } from "zustand/react/shallow";

const messages = useProjectsStore(
  useShallow((s) => s.projects.get(id)?.conversation.messages ?? EMPTY_MESSAGES)
);
const entries = useProjectsStore(
  useShallow((s) => s.projects.get(id)?.dirContents.get(path) ?? EMPTY_ENTRIES)
);
```

### For computed values — compute inside the selector:
```tsx
// BAD: returns Map, re-renders always
const statuses = useProjectsStore((s) => s.projects.get(id)?.git.fileStatuses);
const hasChanges = statuses ? [...statuses.keys()].some(...) : false;

// GOOD: returns boolean, only re-renders when result changes
const hasChanges = useProjectsStore((s) => {
  const statuses = s.projects.get(id)?.git.fileStatuses;
  if (!statuses) return false;
  for (const p of statuses.keys()) {
    if (p.startsWith(path + "/")) return true;
  }
  return false;
});
```

### For imperative reads (event handlers, effects) — getState():
```tsx
const handleClick = () => {
  const { projects } = useProjectsStore.getState();
  const project = projects.get(id);
  // Fine — not a subscription, no re-render
};
```

### Module-level empty constants for fallbacks:
```tsx
// BAD: creates new array on every render when todos is undefined
const todos = useProjectsStore((s) => s.projects.get(id)?.conversation.todos ?? []);

// GOOD: stable reference
const EMPTY_TODOS: Todo[] = [];
const todos = useProjectsStore(
  useShallow((s) => s.projects.get(id)?.conversation.todos ?? EMPTY_TODOS)
);
```

## Severity
**CRITICAL** — Violating these rules during Claude streaming causes "Maximum update depth exceeded" errors and makes the app unusable.
