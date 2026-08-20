# Environment Configuration

`backend/config/env.js` is the single source of truth for every environment
variable the backend reads. It declares each variable's type, whether it is
required, its default, and any constraint — and validates the whole environment
at startup, before anything else loads.

---

## Why

Before this, configuration was read ad-hoc with bare `process.env.X` calls
scattered across the backend, and the only startup validation was two hand-written
checks in `server.js`. That produced a recurring class of bug:

- **Failures surfaced far from the cause.** A missing `SMTP_HOST` didn't fail at
  boot; it failed hours later when someone tried to reset a password.
- **Numbers arrived as strings.** `parseInt` on a typo yields `NaN`, giving a
  subtly broken rate limiter rather than an error.
- **`"false"` is truthy.** Anywhere the `=== 'true'` comparison was forgotten, a
  disabled feature was enabled.
- **Weak secrets passed.** `JWT_SECRET` was only checked for *existence*, so a
  one-character secret — or the placeholder copied from `.env.example` — booted
  happily in production.
- **Nothing was discoverable.** No one place told a new contributor what the
  backend actually needs.

---

## Behaviour by environment

| `NODE_ENV` | On invalid configuration |
| --- | --- |
| `production` | Prints every problem, then `process.exit(1)` |
| `development` | Prints every problem as a warning, continues on defaults |
| `test` | Never exits |

Development stays runnable with an empty `.env` so a frontend contributor isn't
blocked on provisioning Redis and SMTP. Production has no such excuse. Test never
hard-exits, because an exit inside the runner kills the whole run and hides the
actual assertion failure.

All problems are reported **together**:

```
Environment configuration is invalid:

  • DATABASE_URL: is required in production
      Set the PostgreSQL connection string, e.g. postgres://user:pass@host:5432/db
  • JWT_SECRET: must be at least 32 characters in production
      A short signing key is brute-forceable. Generate one with: openssl rand -hex 32
  • CLIENT_URL: is required in production (or set CLIENT_ORIGIN / CORS_ORIGIN)

See backend/.env.example for the full list of supported variables.
```

An operator fixing a fresh deployment sees the whole list in one pass instead of
playing whack-a-mole across six restarts.

---

## Required in production

| Variable | Rule |
| --- | --- |
| `DATABASE_URL` | Must be set |
| `JWT_SECRET` | Must be set **and** at least 32 characters |
| `CLIENT_URL` | Must be set, or `CLIENT_ORIGIN`, or `CORS_ORIGIN` |

Generate a secret with:

```bash
openssl rand -hex 32
```

---

## Coercion rules

**Integers** are parsed and bounds-checked. A non-numeric or non-integer value is
rejected rather than becoming `NaN`:

```
PORT=eighty-eighty   → PORT: expected an integer, received "eighty-eighty"
PORT=70000           → PORT: must be <= 65535, received 70000
```

**Booleans** accept `true/false`, `1/0`, `yes/no`, `on/off` (case-insensitive) and
return a real boolean. Anything else is rejected rather than guessed:

```
SMTP_SECURE=false    → false   (not the truthy string "false")
SMTP_SECURE=maybe    → SMTP_SECURE: expected a boolean …
```

**Enums** are constrained: `NODE_ENV` ∈ {development, test, production},
`LOG_LEVEL` ∈ {error, warn, info, debug, silent}.

**URLs** (`CLIENT_URL`, `FRONTEND_URL`) must parse as valid URLs.

---

## Empty and placeholder values

`FOO=` in a `.env` file means "unset", not "the empty string" — empty and
whitespace-only values are normalised to `undefined` so `.optional()` and defaults
behave the way an operator expects.

Values still set to a placeholder are treated the same way:

```
your_gemini_api_key_here    changeme       placeholder
your_jwt_secret_here        change_me      <your-key>
xxxxx
```

A placeholder that boots successfully is worse than one that fails: SMTP silently
sends nowhere, and a placeholder `JWT_SECRET` is a publicly known signing key.

---

## Startup summary

On boot the server logs which optional integrations are configured — names and
status only, never values:

```
Configuration loaded (production) — integrations: {
  redis: 'enabled',   gemini: 'enabled',      smtp: 'enabled',
  googleOAuth: 'enabled', githubOAuth: 'disabled', webPush: 'disabled'
}
```

A credential *pair* counts as enabled only when both halves are present, so a
half-configured OAuth provider reads as disabled rather than appearing to work.

---

## Adding a variable

1. Add it to the schema in `backend/config/env.js` with its type, default and any
   constraint.
2. If it is mandatory in production, add a rule to `productionRules` with a `hint`
   telling the operator how to obtain a value.
3. If it enables an optional integration, add a predicate to `INTEGRATIONS`.
4. Document it in `backend/.env.example`.
5. Read it from the validated config object rather than `process.env`.
