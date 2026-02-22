---
title: "Three.js Setup Patterns"
domain: "patterns/code"
tags: ["threejs", "3d", "webgl", "performance", "loading"]
created: "2023-03-01"
updated: "2026-02-17"
---

# Three.js Setup Patterns

## Standard Scene Setup
- Use @react-three/fiber for React integration
- Canvas component wraps the entire 3D scene
- Suspense boundaries for async loading
- OrbitControls from drei for camera interaction

## Performance Considerations
- Progressive loading for large 3D assets
- LOD (Level of Detail) for complex scenes
- Instancing for repeated geometry
- Fallback to 2D for low-end devices
- Test on actual target hardware (low-end Android phones)

## Asset Pipeline
- GLTF/GLB preferred format
- Draco compression for mesh data
- Texture atlasing to reduce draw calls
- Lazy loading for non-critical assets

## Common Patterns
- Scene manager component for state
- Custom hooks for animation loops
- Event system for 3D interactions
- Responsive canvas sizing
