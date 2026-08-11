---
title: '[PERF/INFRA]: Automated PostgreSQL Migrations, Seeds, and Healthchecks in Docker Setup'
labels: 'ECSoC26, ECSoC26-L1, infrastructure, devops, database, backend'
assignees: ''
---

## Issue Type
Infrastructure / Developer Experience

## Priority
P2 Medium

## Summary
Enhance the root `docker-compose.yml` and container orchestration by adding automatic database migrations, environment seed data generation scripts, robust container healthchecks, and volumes handling for seamless one-command developer onboarding (`docker-compose up`).

## Problem Statement
Currently, running `docker-compose up` spins up backend and frontend containers, but requires developers to manually run database migrations, seed scripts, or handle startup race conditions where the Express backend starts before the PostgreSQL database container is ready to accept socket connections.

## Current Behavior
Backend container sometimes crashes on cold boot due to missing database tables or premature connection attempts before PostgreSQL initializes. Developers must manually run `npm run migrate` inside container terminal.

## Expected Behavior
1. `docker-compose up --build` waits for PostgreSQL healthcheck (`pg_isready`) before launching backend.
2. Backend container automatically executes Sequelize migrations (`sequelize db:migrate`) and populates realistic dev seed data (`sequelize db:seed:all`) on initial setup.
3. Live hot-reloading (volumes) works smoothly for both frontend Vite and backend Nodemailer/Express services.

## User Story
As a new open-source contributor  
I want to run `docker-compose up` and have a fully seeded database and working application in seconds  
So that I can start fixing bugs or building features immediately without manual database setup steps  

## Proposed Solution
1. Update `docker-compose.yml` with `healthcheck` definition for `postgres` service and `depends_on: postgres: condition: service_healthy` for `backend`.
2. Create `backend/scripts/docker-entrypoint.sh` script to run migrations, seeds, and start server.
3. Create `backend/seeders/demo-data.js` containing realistic mock exams, subjects, topics, notes, and flashcard decks.

## Technical Scope

### Frontend Impact
- Update `frontend/Dockerfile` for multi-stage build optimization.

### Backend Impact
- Create `backend/scripts/docker-entrypoint.sh`.
- Create `backend/seeders/` migration and demo seed files.
- Update `backend/Dockerfile`.

### Database Impact
- Automated execution of all Sequelize migration scripts in `backend/migrations/`.

### API Impact
None.

### Infrastructure Impact
Updates to `docker-compose.yml` and Dockerfiles.

## Acceptance Criteria
- [ ] Running `docker-compose up --build` on clean machine spins up system without crash loops.
- [ ] Backend waits for PostgreSQL `service_healthy` signal before initiating Sequelize sync.
- [ ] Initial boot populates database with test user (`demo@openprep.ai` / `password123`) and sample subjects.
- [ ] Code modifications in `/backend` or `/frontend` host folders trigger instant hot-reloading inside container.
- [ ] `docker-compose down -v` cleans volumes properly.

## Edge Cases
- [ ] DB migration failure -> fail container startup cleanly with red log output instead of silent fallback.

## Security Considerations
Ensure default passwords in `docker-compose.yml` are clearly marked for development use only and overridable via `.env` file.

## Accessibility Considerations
N/A.

## Performance Considerations
Use Docker build caching layers to ensure standard `docker-compose up` takes < 5 seconds on subsequent runs.

## Testing Requirements

### Manual Testing
- [ ] Wipe Docker containers/volumes (`docker-compose down -v`) and verify clean boot from `docker-compose up --build`.
- [ ] Verify test login works out of the box with seeded demo user.

## Affected Areas
- [x] Infrastructure
- [x] Backend
- [x] Database

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 1 (Easy / Beginner-friendly) (ECSoC26-L1)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] One-command launch verified
- [ ] Setup guide updated with Docker command instructions
- [ ] Ready for production
