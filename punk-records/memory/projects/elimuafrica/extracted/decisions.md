# Decisions

*Auto-maintained by Session Observer*

## Comprehensive production configuration audit completed - identified critical and high-risk issues
- **Date:** 2026-02-22
- **Why:** Recent production issues revealed incomplete configuration. Systematic analysis needed to prevent future incidents.
- **Confidence:** medium

## Added persistent Docker volumes for ML models and training data to prevent data loss on container restarts
- **Date:** 2026-02-23
- **Why:** MODEL_STORAGE_PATH and TRAINING_DATA_PATH had no volumes mounted - any ML models or training signals would be lost when containers restart
- **Confidence:** medium

## Added log rotation configuration to all production Docker containers to prevent disk space exhaustion
- **Date:** 2026-02-23
- **Why:** No log rotation configured - logs could grow indefinitely and fill disk over time
- **Confidence:** medium

## Added .env.docker.prod to gitignore to prevent accidental commit of production secrets
- **Date:** 2026-02-23
- **Why:** File contains POSTGRES_PASSWORD, API keys, JWT_SECRET, and Cloudflare tunnel token - critical security risk if committed to git
- **Confidence:** medium

## Configured nginx to use Docker's DNS resolver with variable-based upstream for dynamic IP resolution
- **Date:** 2026-02-23
- **Why:** nginx's default behavior of caching DNS at startup is incompatible with Docker's dynamic IP allocation on container restarts
- **Confidence:** medium

