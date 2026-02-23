# Lessons Learned

*Auto-maintained by Session Observer*

- Production environment audits must check for volume persistence - ephemeral containers need explicit volumes for all critical data paths
- Docker log rotation is not enabled by default - must be explicitly configured to prevent production disk space issues
- nginx caches DNS resolution at startup by default - critical issue in Docker where containers can get new IPs on restart
