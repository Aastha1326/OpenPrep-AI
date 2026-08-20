# Account Data Export & Deletion

Self-service data portability and erasure for OpenPrep AI accounts. Both endpoints
are authenticated, rate-limited, and act only on the account making the request —
there is no way to target another user.

---

## `GET /api/users/me/export`

Returns a single JSON archive of everything the account owns, served as a download
(`openprep-export-YYYY-MM-DD.json`) with `Cache-Control: no-store, private`.

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-08-12T09:14:02.113Z",
  "profile": { "id": "…", "name": "Asha", "email": "asha@example.com", "xp": 420 },
  "data": {
    "exams": [], "subjects": [], "topics": [], "pyqs": [], "studyPlans": [],
    "quizzes": [], "quizAttempts": [], "quizBookmarks": [], "notes": [],
    "flashcards": [], "progress": [], "focusSessions": [], "achievements": [],
    "badges": [], "pyqAnalyses": [], "battleParticipations": [],
    "feedback": [], "activityLogs": []
  },
  "meta": {
    "counts": { "notes": 42, "flashcards": 318 },
    "truncated": [],
    "errors": []
  }
}
```

`schemaVersion` lets the format evolve without breaking consumers. Flashcards carry
their full SM-2 scheduling state, so a deck can be reconstructed elsewhere.

### What is never exported

The profile is built from an **allowlist** of columns, not a denylist. A denylist
fails open — the day someone adds an `mfaSecret` column it would be exported
silently. An allowlist fails closed: a new field is simply absent until it is added
to `EXPORTABLE_USER_FIELDS`, which is a bug report rather than a breach.

Excluded: `password`, `refreshTokens`, `refreshTokenExpire`, `emailVerificationToken`,
`resetPasswordToken`, `resetPasswordOtpHash`, `googleCalendarRefreshToken`,
`pushSubscription`, and anything else not on the allowlist.

Related tables get a second safety net: any column whose name matches
`password|secret|token|apikey|privatekey` is replaced with `[REDACTED]`.

### Bounds

Rows are read in pages of 500, capped at 5000 per entity. A capped entity is named in
`meta.truncated` rather than being silently cut short. If one entity fails to read,
the export still returns the rest and records the failure in `meta.errors` — a partial
archive is more useful to someone trying to leave than a 500.

**Rate limit:** 5 requests per hour.

---

## `DELETE /api/users/me`

Permanent and irreversible. There is no soft-delete and no recovery window.

### Confirmation

| Account type | Required body |
| --- | --- |
| Has a password | `{ "password": "<current password>" }` |
| OAuth-only (no password) | `{ "confirmation": "DELETE MY ACCOUNT" }` |

The phrase is matched exactly — case, spacing and all. An OAuth-only account cannot
be deleted by supplying a password, and a password account cannot be deleted with the
phrase.

### What happens

1. Every file the user owns (avatar, note uploads, PYQ uploads) is located **before**
   their rows are removed.
2. All owned rows are deleted in one transaction, children before parents
   (`QuizAttempt` → `Quiz`, `BattleParticipant` → `BattleSession`, `Topic` → `Subject`
   → `Exam`), so a failure part-way cannot leave orphans pointing at a user that no
   longer exists.
3. The user row is deleted last.
4. **After the transaction commits**, the collected files are unlinked. Doing this
   before the commit would destroy files for an account that still exists on rollback.

File paths are re-resolved against the uploads directory and anything escaping it is
skipped — the values come from the database but originate in user uploads.

An unlink failure does not fail the request: the rows are already gone, and reporting
failure would tell the user their deletion did not happen when it did. Failures are
returned in `fileErrors` for operator follow-up.

```json
{
  "success": true,
  "data": {
    "message": "Your account and all associated data have been permanently deleted.",
    "deleted": { "Note": 42, "Flashcard": 318, "User": 1 },
    "filesRemoved": 7
  }
}
```

**Rate limit:** 5 attempts per 15 minutes — this exists to blunt brute-forcing the
password confirmation, not to throttle legitimate use.

---

## Extending the export

When a new user-owned table is added:

1. Add an entry to `EXPORT_ENTITIES` in `backend/services/accountDataService.js`
   (`key`, `model`, `foreignKey` — the FK column name is inconsistent across the
   schema, so it must be declared explicitly).
2. Add a matching entry to `DELETE_ORDER`, positioned **before** any table it
   references.
3. If the new table is user-facing profile data, add the column to
   `EXPORTABLE_USER_FIELDS`.
