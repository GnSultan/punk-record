---
title: "pane-design-rules"
domain: "patterns/design"
tags: ["pane","design","ui","rules"]
created: "2026-02-23"
updated: "2026-02-23"
---

# Pane Design Rules

Crystallized from multiple design review sessions with Aslam. These are firm rules, not suggestions.

## Inputs
- **No borders on inputs, ever.** Inputs are defined by their container surface (`bg-pane-surface`), not by border lines. The container is the input's identity.
- **bg-transparent on actual input/textarea**, `bg-pane-surface rounded-lg` on the wrapper div.
- **Ghost placeholders** at `text-pane-text-secondary/30` — barely visible until focused.
- **Terse, lowercase placeholders** — "write to claude...", "open file", "pattern", "commit message". Never "Search in files..." or "Enter your message here".

## Floating UI (Search, Modals)
- **No overlay backdrop.** Panels float over content like Spotlight — no darkened overlay. The overlay was the most generic pattern.
- **Start collapsed, expand on demand.** Don't pre-load results. Show nothing until the user types.
- **One unified block** — input and results in the same `bg-pane-surface rounded-lg` container. The input expands into results, not two separate panels.
- **Entry animation** via `animate-fadeSlideUp` (0.12s ease-out).

## Borders & Surfaces
- **No shadows.** Surfaces defined by color difference (`bg-pane-surface` vs `bg-pane-bg`), not elevation.
- **Borders only for structural separation** (panel sections, toolbars). Never decorative.
- **No borders on interactive inputs** — only structural layout borders.

## Typography Hierarchy
- **Weight and size, not color** for hierarchy. IBM Plex Mono for code/user content, Bricolage Grotesque for UI labels.
- **Section labels**: tiny uppercase `tracking-wider` at 10px, `text-pane-text-secondary/50`.
- **Terminal accent** (`--pane-terminal: #8AACCA`) for machine-generated context: tool labels, line numbers, "grep" label.

## Opacity Rules (CRITICAL)
- `--pane-text-secondary` is already ~40% contrast. Stacking Tailwind opacity on top drops effective contrast dangerously.
- Functional UI elements: at least `/60-/70` on secondary colors.
- Ambient/decorative: can go to `/40-/50`.
- Ghost text: `/20-/30`.
- Never below `/20` for anything visible.

## Interactive States
- Selected: `bg-pane-text/[0.07]`
- Hover: `bg-pane-text/[0.04]`
- Active press: `btn-press` class (opacity: 0.7 on :active)
- Disabled: `opacity-40` or `/25` on text
