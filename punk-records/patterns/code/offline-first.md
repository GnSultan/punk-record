---
title: "Offline-First Data Architecture"
domain: "patterns/code"
tags: ["offline", "sync", "service-worker", "indexeddb", "pwa", "tanzania"]
created: "2022-06-01"
updated: "2026-02-17"
---

# Offline-First Data Architecture

**Description:** All data operations work locally first, with sync as an enhancement.

## Core Principle
Assume no internet. Treat connectivity as a bonus, not a requirement.

## Standard Stack
- Service Workers for caching
- IndexedDB for local storage
- Background Sync API when connection returns
- Optimistic UI updates

## Implementation Principles
1. Write to local storage first, always
2. Queue operations for when connection returns
3. Optimistic UI updates — show success before confirmation
4. Visual indicator of sync status
5. Conflict resolution: last-write-wins (simple) or user choice (important)

## Sync Strategy
1. All writes go to local first
2. Queue operations for sync
3. Resolve conflicts with last-write-wins (for now)
4. Visual indicator of sync status

## When to Use
- Any product targeting Tanzanian/African users
- Educational platforms
- Content that should be accessible anywhere
- Data entry that can't be lost

## When to Avoid
- Real-time collaboration that requires consistency
- Financial transactions requiring immediate confirmation
- Features where stale data is dangerous

## Key Rules
- Never block UI on network requests
- Always show cached data immediately
- Queue mutations locally, sync in background
- Handle conflict resolution gracefully
- Test with network throttling and airplane mode

## Applied In
- ElimuAfrica (primary architecture pattern)
- Proposed safari website concepts

**Success Rate:** 95% — proven across 12+ implementations.
