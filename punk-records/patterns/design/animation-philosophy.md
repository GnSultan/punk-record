---
title: "Animation Philosophy"
domain: "patterns/design"
tags: ["animation", "motion", "framer-motion", "lenis", "webgl", "parallax", "cursor", "scroll", "spring-physics"]
created: "2023-01-01"
updated: "2026-02-17"
---

# Animation Philosophy

## Motion is Architecture, Not Decoration

Animation isn't sprinkled on at the end. It's structural — it communicates hierarchy, confirms interaction, creates spatial depth. If the motion were removed, the design would feel broken, not just "less fancy."

## The Motion Stack

Each layer serves a different purpose:

### 1. Smooth Scrolling (Lenis)
The foundation layer. Everything else sits on top of buttery scroll.
- Duration: 1.5s with cubic ease `1 - (1-t)^3`
- Wheel multiplier: 1.12x for responsive feel
- Navigation scrolls: 2.5s duration for dramatic, intentional movement
- Respects `prefers-reduced-motion` (drops to 0.6s)

### 2. Scroll-Triggered Reveals (Framer Motion)
Content earns its place by appearing as the user reaches it.
- `whileInView` with `viewport={{ once: true }}` — animate once, don't repeat
- Standard pattern: opacity 0 → 1, translateY 20px → 0
- Duration: 0.6s with staggered delays between siblings
- Easing: easeOut cubic

### 3. Parallax Depth
Creates spatial hierarchy — foreground moves faster than background.
- Images: speed -0.5 to -0.8 (subtle, not nauseating)
- Decorative elements: rotation tied to scroll progress (e.g., asterisk rotates 360deg over scroll range)
- Scale and opacity transform together for "receding into distance" effect
- Uses `useScroll()` + `useTransform()` from Framer Motion

### 4. Custom Cursor (Spring Physics)
The cursor is a living element that responds to context.
- Spring-based movement for fluid tracking (no lerp jitter)
- Adaptive spring config: stiffer when precise, looser when floating
- Magnetic attraction within 120px of interactive elements
- Visual states:
  - Default: 32px white circle, `mix-blend-mode: difference`
  - Hover: expands to 50px
  - Text mode: expands to 115-140px with label ("View", "Drag", "Explore")
  - Click: compresses to 20px with ripple effect (600ms)
  - Navigation click: larger ripple (140px, 1000ms)
- Hidden on touch devices — don't fake what isn't there

### 5. Hero Entrances
The first impression is choreographed.
- Name appears in staggered blocks: opacity 0 → 1, x -50 → 0
- Duration: 1.2s with 0.3-0.5s delays between elements
- Supporting text and elements follow in sequence
- Nothing appears all at once — everything has an entrance order

### 6. WebGL Fluid Background
Ambient, organic motion that makes the page feel alive.
- 3D Perlin noise for organic movement
- Fractal Brownian Motion (FBM) for natural wave patterns
- Mouse position influences displacement (smooth interpolation)
- GPU-accelerated — runs at 60fps without taxing the main thread

### 7. Gallery Carousel
Infinite horizontal scroll with physics.
- Auto-scrolling baseline with drag override
- Framer Motion `drag="x"` with momentum
- Parallax offset: 12% in opposite direction during drag (creates depth)
- Item scale: 0.975 when dragging, 1.0 at rest
- Modulo-based infinite wrapping — no visible reset

## Principles

### Every Motion Has a Job
- Reveals communicate "you've arrived here"
- Parallax communicates depth and spatial relationship
- Cursor feedback communicates "this is interactive"
- Ripples communicate "action received"
- Hover transitions communicate "this responds to you"

### Timing Matters More Than Effect
- 0.3s for hover states (fast, responsive)
- 0.6s for scroll reveals (noticeable but not slow)
- 0.8s for divider animations (deliberate, architectural)
- 1.2s for hero entrances (dramatic, first-impression worthy)
- 1.5-2.5s for scroll duration (smooth, premium feel)

### Performance is Non-Negotiable
- Only animate `transform` and `opacity` — nothing that triggers layout
- `will-change: transform` on parallax elements
- `backface-visibility: hidden` to force GPU compositing
- `prefers-reduced-motion` disables or simplifies all motion
- WebGL runs on GPU, not main thread

### Restraint Over Spectacle
- Parallax speeds are subtle (-0.5 to -0.8), not aggressive
- Scale transforms are tiny (1.02, 0.975) — felt, not seen
- No bouncing, no overshooting springs, no elastic effects
- The premium feel comes from smoothness, not from showing off
