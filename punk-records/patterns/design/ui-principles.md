---
title: "UI Principles"
domain: "patterns/design"
tags: ["ui", "design", "typography", "layout", "whitespace", "hierarchy", "responsive", "accessibility", "african-context"]
created: "2021-01-01"
updated: "2026-02-17"
---

# UI Design Principles

## Design for Clarity, Not Information Density

The goal is never to show everything — it's to make what matters land. Say less, have it hit harder. A car rental hero doesn't need car photos. "Book it. Drive it." is enough. Three promises at the bottom: "Clean vehicles. Clear pricing. Quick response." — done.

## Typography is the Design

When you strip color away, typography carries the entire visual system. This is deliberate.

- **Extreme hierarchy**: Headlines dominate 60%+ of the viewport. Supporting text is small but readable. The contrast between them creates the layout.
- **Tight letter-spacing on headlines**: -0.02em to -0.03em. Makes large text feel dense and intentional.
- **Generous line-height on body**: 1.6-1.7. Gives the reader room to breathe.
- **One typeface per project**: Clash Grotesk for the portfolio. Weight variation (200-700) creates all the hierarchy needed — no second font required.
- **Fluid sizing with clamp()**: `clamp(4rem, 7vw, 7rem)` for headlines. No breakpoint jumps. Text scales continuously from mobile to 4K.
- **65 character max for body text**: Optimal reading width. Constrain content, don't let it sprawl.

## Whitespace is a Feature

Empty space is not wasted space — it's the design. The right half of a viewport can be empty except for a geometric element, and that's the correct answer.

- Sections spaced with `clamp(4rem, 8vw, 8rem)` — generous and fluid
- Content doesn't fill available space. It occupies what it needs.
- 70/30 content splits create visual hierarchy without cluttering

## Every Interaction Has Feedback

Nothing is silent. The interface always responds.

- **Hover**: Underlines animate from 0 to 100% width. Images shift from grayscale to color. Cards scale subtly (1.02).
- **Click**: Cursor compresses (0.85 scale). Ripple effects confirm the action.
- **Scroll**: Elements reveal with staggered opacity/translate. Parallax creates depth.
- **Drag**: Gallery items offset with parallax in the opposite direction.
- **Cursor**: Changes shape, size, and label based on context — "View", "Drag", "Explore".

## Signature Visual Elements

- **Geometric asterisk/star motif**: An abstract anchor that adds character without being literal. Carries across projects (portfolio, Thabiti).
- **1px grid overlay**: Subtle vertical lines on the background. Creates structure without visual noise.
- **Full-width 1px dividers**: Animated with scaleX from 0 to 1. Clean section breaks.

## Responsive is Fluid, Not Breakpoint-Based

Don't design for "mobile" and "desktop" — design for a continuous spectrum.

- All sizing uses `clamp()` for smooth scaling
- Aspect ratios maintained with CSS `aspect-ratio`
- Grid backgrounds adapt spacing (80px mobile, 200px desktop)
- No jarring layout shifts between screen sizes

## Mobile-First, Real-Device Tested

Most Tanzanian users are on phones. Design for that reality.

- Touch targets sized for real fingers
- Test on low-end devices, not just flagships
- Swahili text lengths differ from English — design for both
- Offline state is a first-class UI concern, not an error state

## Accessibility is Architecture, Not a Checklist

- 2px focus outlines with offset on all interactive elements
- `prefers-reduced-motion` support throughout all animations
- WCAG AA+ contrast with high-contrast palettes
- Semantic HTML with proper heading hierarchy
- Screen reader content, ARIA labels, skip links
- Keyboard fully navigable

## Performance as Design

- Skeleton screens over spinners
- Lazy loading images except hero/priority content
- GPU-accelerated transforms: `will-change`, `translateZ(0)`, `backface-visibility: hidden`
- Every KB of JavaScript is a tax on the user
- Image optimization: WebP, responsive sizes, quality 90
