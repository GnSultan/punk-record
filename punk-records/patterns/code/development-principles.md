---
title: "Development Principles"
domain: "patterns/code"
tags: ["typescript", "eslint", "code-quality", "strict", "principles", "no-any"]
created: "2026-02-17"
updated: "2026-02-17"
---

# Development Principles

## Strict TypeScript, No Exceptions
- Always use strict TypeScript configuration
- No `any` types — ever. Type everything properly or fix the underlying type issue
- No `as` casts to escape the type system unless the external library gives no other option
- No `@ts-ignore` or `@ts-expect-error` — fix the actual problem
- No prefixing unused variables with underscores — if it's unused, it's dead code

## Zero Dead Code
- If a variable is unused, either wire it up or delete it
- No commented-out code left in the codebase
- No TODO comments that linger — either do it now or track it elsewhere
- If an import is unused, remove it
- If a function is unused, delete it entirely
- No backwards-compatibility shims or deprecated re-exports

## No Fallback Architecture
- Don't degrade code with fallback implementations
- Build reliable architecture that works correctly the first time
- If something can fail, handle it properly — don't silently swallow errors and return defaults
- No `.catch(() => [])` patterns — handle the error or let it propagate
- No "graceful degradation" that masks broken functionality
- If a feature needs a dependency, make sure the dependency works — don't code around it maybe not working

## ESLint with Strict Rules
- Always configure ESLint on every project
- Strict rule set — no warnings, only errors
- No `eslint-disable` comments — fix the code instead
- Consistent formatting and patterns enforced by tooling

## Code Quality and Organization
- Clean, minimal, purposeful architecture
- Every file has a clear single responsibility
- Imports organized and explicit
- No magic strings or numbers — use constants
- Types and interfaces defined centrally and reused
