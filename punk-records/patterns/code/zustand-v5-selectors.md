---
title: "zustand-v5-selectors"
domain: "patterns/code"
tags: ["zustand","react","infinite-loop","selectors","v5","useSyncExternalStore"]
created: "2026-02-23"
updated: "2026-02-23"
---

# Zustand v5 Selector Rules

## The Cardinal Rule
**NEVER return new object/array references from a Zustand selector.** Zustand v5 uses `useSyncExternalStore` internally, which requires `getSnapshot` to return the same reference when state hasn't changed. Violating this causes "Maximum update depth exceeded" — an infinite render loop.

## What Kills You

```tsx
// INFINITE LOOP — new object every call
useStore(s => ({ a: s.a, b: s.b }))

// INFINITE LOOP — useShallow + array of inline objects
useStore(useShallow(s => s.ids.map(id => ({ id, name: s.items.get(id)?.name }))))

// INFINITE LOOP — new array from .map()/.filter() without useShallow
useStore(s => s.items.filter(i => i.active))

// INFINITE LOOP — fallback creates new ref
useStore(s => s.data ?? [])
useStore(s => s.data ?? {})
```

## What Works

```tsx
// Primitive selectors — always safe
useStore(s => s.count)
useStore(s => s.name)
useStore(s => s.projects.get(id)?.name ?? "")

// useShallow with array of PRIMITIVES — safe
useStore(useShallow(s => s.items.map(i => i.id)))  // string[]

// useShallow with stable nested references — safe
useStore(useShallow(s => s.projects.get(id)?.dirContents.get(path) ?? EMPTY_ARRAY))

// Module-level empty fallback — safe
const EMPTY: Item[] = [];
useStore(s => s.items ?? EMPTY)
```

## The Pattern for Derived Data
When you need an array of objects from a Map/store, DON'T put it in a selector. Instead:

1. Subscribe to the **order/keys** array (primitive array via `useShallow` or direct ref)
2. Extract each item into its **own component** with primitive selectors

```tsx
// Parent: subscribes to order only
function List() {
  const ids = useStore(s => s.projectOrder);
  return ids.map(id => <Row key={id} id={id} />);
}

// Child: subscribes to its own primitives
function Row({ id }: { id: string }) {
  const name = useStore(s => s.projects.get(id)?.name ?? "");
  const isActive = useStore(s => s.activeId === id);
  return <div>{name}</div>;
}
```

## Diagnosis
When you see "Maximum update depth exceeded", add the component stack to ErrorBoundary. The guilty component will be the one whose selector creates new references on every call.
