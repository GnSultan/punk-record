---
title: "ElimuAfrica Patterns"
domain: "memory"
tags: ["elimuafrica", "patterns", "code", "architecture"]
created: "2023-01-01"
updated: "2026-02-17"
---

# ElimuAfrica — Reusable Patterns

## Offline Data Sync Pattern
- All writes go to IndexedDB first
- Sync queue manages pending operations
- Background sync when connection detected
- Conflict resolution: last-write-wins for student data
- Visual sync status indicator in UI

## 3D Lab Component Pattern
- Canvas wrapper with Suspense for loading
- Scene components receive state via React props
- Custom hooks for animation loops
- Touch-friendly OrbitControls
- Progressive quality based on device capability
- 2D fallback component for low-end devices

## AI Content Pipeline
- Structured prompt templates per subject/topic
- Curriculum metadata injected into prompts
- Output validated against expected schema
- Swahili language quality check pass
- Difficulty calibrated by student performance data
- Generated content cached locally for offline access

## Assessment Engine Pattern
- Auto-marking with detailed step-by-step feedback
- Multiple attempt support with progressive hints
- Performance tracking in IndexedDB
- Difficulty adjustment based on rolling accuracy
