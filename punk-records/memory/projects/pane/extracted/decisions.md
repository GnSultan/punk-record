# Decisions

*Auto-maintained by Session Observer*

## Switching from CodeMirror 6 to React Ace for editor component
- **Date:** 2026-02-22
- **Why:** CodeMirror not delivering refined editing experience. React Ace provides Cloud9-level quality at 500KB vs Monaco 5-10MB. Right balance for Pane.
- **Confidence:** medium

## Upgraded Electron from 33.4.11 to 40.6.0 to fix macOS 26 Tahoe WindowServer GPU bug (electron/electron#48311). This was the single biggest performance improvement — went from 20fps feel to near-native.
- **Date:** 2026-02-23
- **Why:** Electron 33 had _cornerMask override that forced WindowServer to re-render masks per-window per-frame on macOS 26
- **Confidence:** medium

