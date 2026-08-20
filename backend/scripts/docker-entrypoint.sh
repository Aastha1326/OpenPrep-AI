#!/bin/sh
set -e

# Run database migrations
echo "\033[1;36mRunning database migrations...\033[0m"
if ! node scripts/migrate.js; then
  echo "\033[1;31mDATABASE MIGRATION FAILED! Aborting container startup.\033[0m"
  exit 1
fi

# Run database seeding
echo "\033[1;36mDatabase seeding...\033[0m"
if ! node scripts/seed.js; then
  echo "\033[1;33mDatabase seeding finished (or skipped).\033[0m"
fi

if [ "$NODE_ENV" = "development" ]; then
  echo "\033[1;32mStarting server in development mode...\033[0m"
  exec npm run dev
else
  echo "\033[1;32mStarting server in production mode...\033[0m"
  exec npm start
fi
