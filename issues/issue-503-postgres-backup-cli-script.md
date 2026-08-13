---
title: '[INFRA]: Automated Database Backup, Compression & S3 Restore CLI Script for PostgreSQL'
labels: 'ECSoC26, ECSoC26-L1, feature, backend, database, good first issue'
assignees: ''
---

## Issue Type
Infrastructure / Database / DevOps

## Priority
P2 Medium

## Summary
Create a CLI script and automated cron task (`scripts/db-backup.js`) to dump PostgreSQL database schemas and data, compress backups into `.sql.gz` archives, and optionally upload them to S3/Cloud Storage.

## Problem Statement
The development and production database setup lacks automated backup routines. In case of unexpected server crashes, corrupted migrations, or accidental data wipes, there is no standardized procedure or script to take snapshots and restore database state.

## Current Behavior
No database backup script or automated dump process exists in the repository.

## Expected Behavior
Running `npm run db:backup` creates a timestamped compressed PostgreSQL dump (`backup-2026-08-12.sql.gz`) in a `backups/` directory. Running `npm run db:restore --file=backup-2026-08-12.sql.gz` safely restores the database.

## User Story
As a project maintainer or DevOps contributor  
I want automated CLI scripts for database backups and restores  
So that database data is safe from corruption and easy to restore in any environment  

## Proposed Solution
1. Create `scripts/db-backup.js` leveraging `pg_dump` and Node.js `zlib` stream compression.
2. Create `scripts/db-restore.js` leveraging `pg_restore` / `psql` to restore `.sql.gz` backups.
3. Add `npm run db:backup` and `npm run db:restore` commands in `package.json`.
4. Include AWS S3 / Cloud Storage upload capability if `AWS_S3_BUCKET` env vars are configured.

## Technical Scope

### Frontend Impact
None.

### Backend Impact
- New Scripts: `scripts/db-backup.js`, `scripts/db-restore.js`.
- Updates to `package.json` scripts section.

### Database Impact
Protects PostgreSQL database integrity.

### API Impact
None.

### Infrastructure Impact
Can be scheduled as a daily CronJob in Docker or GitHub Actions workflows.

## Acceptance Criteria
- [ ] Running `npm run db:backup` generates valid gzip compressed SQL dump in `backups/` directory.
- [ ] Running `npm run db:restore` restores tables, indexes, and seeded data cleanly.
- [ ] Automatically prunes local backup files older than 14 days to save disk space.
- [ ] Logs clear progress, archive size, and success status in terminal console.

## Edge Cases
- [ ] Missing `pg_dump` binary on host system -> output helpful error message explaining how to install PostgreSQL client tools.

## Security Considerations
Store database backups outside public web root; add `backups/*.sql.gz` to `.gitignore` to prevent committing live database dumps to GitHub.

## Accessibility Considerations
None.

## Performance Considerations
Stream gzip compression to handle databases over 1GB without spiking Node.js RAM usage.

## Testing Requirements

### Unit Tests
- [ ] Test backup file naming, directory creation, and retention cleanup logic.

### Manual Testing
- [ ] Run `npm run db:backup`, verify `.sql.gz` archive created, drop local test table, run `npm run db:restore`, verify table restored.

## Affected Areas
- [x] Backend
- [x] Database

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 1 (Easy / Beginner-friendly) (ECSoC26-L1)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Manual testing passed
- [ ] Setup guide updated
- [ ] Ready for production
