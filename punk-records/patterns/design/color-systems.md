---
title: "Color Systems"
domain: "patterns/design"
tags: ["color", "design", "monochromatic", "theme", "dark-mode", "css-variables", "brand", "accessibility"]
created: "2021-01-01"
updated: "2026-02-17"
---

# Color Systems

## Monochromatic by Choice, Not Limitation

Stripping color away forces design quality. When you can't rely on color to create hierarchy, everything else has to work harder — typography, spacing, weight, motion. If the design holds in grayscale, it holds.

## How This Shows Up in Practice

### Portfolio — Black/White with Full Inversion
```
Light mode:
  background:     #FAFAFA (off-white)
  text:           #0F0F0F (near-black)
  text-secondary: #2A2A2A (dark gray)
  secondary:      #E5E5E5 (light gray)

Dark mode:
  background:     #0F0F0F (near-black)
  text:           #FAFAFA (off-white)
  text-secondary: #B0B0B0 (medium gray)
  secondary:      #2A2A2A (dark gray)

Footer: fully inverts — black footer in light mode, white footer in dark mode
```

The palette is 4 values. Primary color equals text color. No accent color. The design works because typography and motion carry the hierarchy, not color.

### Thabiti — Single-Hue Muted Palette
```
  background:     muted lavender-gray
  text:           dark charcoal-gray
  CTA button:     dark gray pill, muted
```

Same principle, different tone. One hue family, no competing colors. The background has just enough warmth to feel approachable without being "colorful."

## The Pattern

Both projects share the same approach:
1. **Pick one tone family** — black/white or a single muted hue
2. **Let text color = primary color** — no separate brand color needed
3. **Create hierarchy through weight, size, and opacity** — not through different colors
4. **Invert for dramatic contrast** — footer, dark mode, or section breaks flip the palette completely
5. **No accent colors fighting for attention** — if everything is one tone, nothing competes

## CSS Variable Architecture

Theme switching through CSS custom properties on a `[data-theme]` attribute:

```css
:root {
  --background: #FAFAFA;
  --text: #0F0F0F;
  --text-secondary: #2A2A2A;
  --primary: #0F0F0F;
  --secondary: #E5E5E5;
}

[data-theme="dark"] {
  --background: #0F0F0F;
  --text: #FAFAFA;
  --text-secondary: #B0B0B0;
  --primary: #FAFAFA;
  --secondary: #2A2A2A;
}
```

- Variables defined at root, switched by data attribute
- ThemeProvider with localStorage persistence
- System preference detection as fallback
- No flash on load — client-side hydration handles transition

## When Color Enters

Color is used surgically, not liberally:
- **Images**: Grayscale by default, full color on hover — color is a reward for interaction
- **Cursor blend mode**: `mix-blend-mode: difference` creates dynamic contrast without adding a color
- **Gradients**: Only dark-to-transparent overlays for text readability on images
- **Borders**: 20% opacity of text color — present but not competing

## Principles

### Fewer Colors, Used Better
One tone family used well beats five accent colors fighting for attention. The constraint is the feature.

### Accessibility Through Contrast, Not Color Coding
With a monochromatic palette, you can't rely on color to differentiate states. This forces proper use of shape, weight, opacity, and motion — which is better for accessibility anyway.

### Test in Real Conditions
- Bright sunlight on phone screens (outdoor Tanzania use)
- Lower-quality displays with limited color accuracy
- WCAG AA minimum contrast ratios

### Cultural Awareness
When color is used in other contexts (brand projects, educational tools):
- Earth tones connect to landscape and authenticity in East African context
- Vibrant colors are culturally appropriate — not "too much"
- Western minimalism (all-white, muted palettes) can feel cold or clinical to local audiences
- Consider device screen quality — colors that look subtle on a MacBook may disappear on a budget Android
