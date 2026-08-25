# OpenPrep AI Schema Migration Guide

This guide details how to execute, write, and rollback automated schema migrations in OpenPrep AI.

## Running Migrations

### 1. Execute Pending Migrations
```bash
npm run db:migrate
# or via dedicated CLI script:
node backend/scripts/run-migrations.js
```

### 2. Dry-Run Verification
To inspect SQL commands without applying them:
```bash
node backend/scripts/run-migrations.js --dry-run
```

### 3. Rollback the Last Migration
```bash
node backend/scripts/run-migrations.js --rollback
```

### 4. Check Migration Status
```bash
node backend/scripts/run-migrations.js --status
```

## Creating a New Migration File

Place new migration scripts in `backend/migrations/` using timestamp or sequential prefixes (e.g. `004_add_user_preferences.js`).

Every migration must export both `up` and `down` functions:

```javascript
exports.up = (pgm) => {
  pgm.addColumn('Users', {
    preferred_theme: { type: 'varchar(20)', default: 'dark' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('Users', 'preferred_theme');
};
```
