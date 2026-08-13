# Logging & Request Correlation

The backend logs through a single leveled logger (`backend/utils/logger.js`) rather than
raw `console.*` calls. Every request carries a correlation ID so an error line can be
traced back to the HTTP request that produced it.

---

## Log levels

| Level   | Use for                                                       |
| ------- | ------------------------------------------------------------- |
| `error` | Unhandled failures, 5xx responses, dependency outages         |
| `warn`  | Handled failures, 4xx responses, degraded/fallback behaviour  |
| `info`  | Lifecycle events (boot, shutdown) and request access lines    |
| `debug` | Verbose diagnostics useful only while developing              |

The active level is resolved per call from the environment:

| Environment                | Active level |
| -------------------------- | ------------ |
| `NODE_ENV=production`      | `info`       |
| `NODE_ENV=test`            | `silent`     |
| anything else              | `debug`      |

`LOG_LEVEL` overrides the default. Accepted values: `error`, `warn`, `info`, `debug`,
`silent`. An unrecognised value is ignored and the environment default applies.

```bash
LOG_LEVEL=debug npm run dev --prefix backend   # verbose local run
LOG_LEVEL=warn  npm start   --prefix backend   # quiet production run
LOG_LEVEL=info  npm test    --prefix backend   # opt back into logs during a test run
```

---

## Output format

**Production** — one JSON object per line, ready for a log drain to index:

```json
{"level":"info","time":"2026-08-12T09:14:02.113Z","message":"request completed","requestId":"5f2c…","method":"POST","path":"/api/quizzes/submit","status":201,"durationMs":84.2,"userId":"c1a…"}
```

**Development** — colourised single lines:

```
INFO  09:14:02.113 request completed method=POST path=/api/quizzes/submit status=201 durationMs=84.2
```

`error` and `warn` go to `stderr`; `info` and `debug` go to `stdout`.

---

## Usage

```js
const logger = require('../utils/logger');

logger.info('study plan generated', { userId, subjectCount: 4 });
logger.error('gemini call failed', { err, model: 'gemini-2.0-flash' });
```

Inside a request handler prefer `req.log`, which is pre-bound to the correlation ID:

```js
exports.createNote = async (req, res, next) => {
  req.log.debug('creating note', { title: req.body.title });
  // …
};
```

Bind additional context with `child()`:

```js
const log = logger.child({ service: 'pdfParser' });
log.info('parse finished', { pages: 42 });
```

---

## Redaction

Everything passed as metadata is recursively copied and scrubbed **before** it is
serialised. A key is treated as sensitive when its normalised name (lowercased, with
`-`/`_`/whitespace removed) matches a known name or contains `password`, `secret`,
`token`, `apikey` or `privatekey`. Matching values are replaced with `[REDACTED]`.

```js
logger.error('login failed', { email, password, refreshToken });
// → {"email":"a@b.com","password":"[REDACTED]","refreshToken":"[REDACTED]", …}
```

The redactor is bounded so a large or hostile payload cannot stall the process:

- recursion stops at depth 6 (`[Object]`),
- arrays are capped at 50 items,
- strings are truncated at 2000 characters,
- circular references become `[Circular]`,
- `Error` objects are serialised to `{ name, message, stack }` with the stack capped
  at 12 frames,
- Sequelize model instances are unwrapped to their `dataValues` before scrubbing, so
  a failed insert logs the columns rather than the whole prototype chain.

> Redaction is a safety net, not a licence. Still avoid deliberately passing secrets
> into log metadata.

---

## Request correlation

`backend/middleware/requestLogger.js` is mounted first in `server.js`, ahead of CORS,
CSRF and the rate limiters, so even rejected requests are traceable. For each request it:

1. assigns an ID — reusing an inbound `X-Request-Id` when that header is short and
   matches `[A-Za-z0-9._-]+`, otherwise generating a UUID (an unvalidated header would
   be a log-injection vector),
2. exposes it as `req.id` and as the bound logger `req.log`,
3. echoes it back on the `X-Request-Id` response header,
4. logs one completion line on `finish` — or an `aborted` line on `close` if the client
   hung up mid-response.

The completion line records `method`, `path` (query string stripped, so tokens passed as
query parameters never land in the log), `status`, `durationMs`, `userId` when
authenticated, and `slow: true` past the threshold (default 1000 ms).

Level follows the status code: `>=500` → `error`, `>=400` → `warn`, otherwise `info` —
so a production `info` level still surfaces every failing request.

### Skipped paths

`/healthz`, `/api/health`, `/api/v1/health`, `/uploads/avatars`, `/favicon.ico` are not
access-logged (platform probes fire every few seconds), but they still receive a
correlation ID. Override with `requestLogger({ skipPaths: [...] })`.

---

## Errors

`middleware/error.js` logs through the bound logger and includes the correlation ID in
the JSON error response:

```json
{ "success": false, "error": "Invalid request", "requestId": "5f2c…" }
```

A user quoting that ID in a bug report gives a maintainer a direct grep key:

```bash
grep '5f2c' app.log | jq .
```

The field is omitted when no ID is present, so responses from code paths that bypass the
middleware are unchanged.
