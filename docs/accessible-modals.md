# Accessible Modal Dialogs

Every dialog in OpenPrep AI should be built on `components/common/Modal`, which
implements the WAI-ARIA dialog keyboard contract. Hand-rolled `fixed inset-0`
overlays do not, and reviewers should push back on new ones.

---

## Using the primitive

```jsx
import Modal from '../common/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create Flashcard"
  description="Both sides are required."   // optional, wired to aria-describedby
  size="lg"                                 // sm | md | lg | xl | full
>
  <YourFormFields />
</Modal>
```

You get, for free:

- focus moved into the dialog on open,
- `Tab` / `Shift+Tab` cycling **within** the dialog,
- `Escape` to close,
- focus restored to the element that opened it,
- background scroll locked without the layout shifting,
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and a close button
  named for the dialog it closes.

### Props worth knowing

| Prop | Default | Use when |
| --- | --- | --- |
| `closeOnEscape` | `true` | Set `false` for a dialog that must be answered (session timeout, quota block) |
| `closeOnBackdrop` | `true` | Set `false` for destructive confirmations |
| `showCloseButton` | `true` | Set `false` alongside `closeOnEscape={false}` |
| `initialFocusRef` | — | Point at the field the user should land on, e.g. a search input |
| `size` | `md` | `full` only for genuinely full-bleed content like the whiteboard |

Backdrop dismissal fires on `mousedown` **on the backdrop itself**, so a text
selection that starts inside the dialog and drags outward does not discard the
user's work.

---

## Using the hook directly

For a dialog that cannot use the shell — a bottom sheet, a command palette, a
popover with dialog semantics — use the hook and supply the ARIA attributes
yourself:

```jsx
import useFocusTrap from '../hooks/useFocusTrap';

const ref = useFocusTrap(isOpen, onClose, { lockScroll: false });

return (
  <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}>
    …
  </div>
);
```

`useFocusTrap(isOpen, onClose, options)` accepts `closeOnEscape`, `lockScroll`
and `initialFocusRef`, and returns the ref to attach to the dialog container.

---

## Implementation notes

**Focusable elements are re-queried on every `Tab`,** not cached when the dialog
opens. Dialog content is frequently async — a subject dropdown that populates
after a fetch — and a cached list would omit anything that arrived later.

**The selector excludes what the browser itself skips:** `[disabled]`,
`tabindex="-1"`, `type="hidden"`, anchors without `href`. Including them would
create cycle stops where `Tab` appears to do nothing.

**Scroll lock compensates for the scrollbar.** Hiding the scrollbar reclaims its
width, which shifts a fixed header sideways as the dialog opens. The body is
padded by the reclaimed width to keep the layout still.

**Visibility detection degrades under jsdom.** A geometry check
(`getClientRects()` / `offsetParent`) is the reliable way to spot an element
hidden by an ancestor, but jsdom reports zero rects for everything including
`<body>`. The hook probes `<body>` first to tell "no layout engine ran" apart
from "this element is hidden", and falls back to computed `display` /
`visibility` when there is no layout.

**A dialog with nothing focusable** gets `tabindex="-1"` on its container and
takes focus there, so it is announced and `Tab` still has somewhere to be
trapped rather than escaping to the page behind.

---

## Migration status

Migrated: `ThemeSelectorModal`, `CreateDeckModal`.

Roughly thirty hand-rolled dialogs remain (`QuizSetupModal`, `CreateNoteModal`,
`CommunityDecksModal`, `PyqAnalysisModal`, `PYQUploadModal`, `CustomQuizModal`,
`RevisionSheetModal`, `SM2SettingsModal`, `ExportModal`, `ForgotPasswordModal`,
`QuotaExceededModal`, …). They are being converted incrementally; a good rule is
to migrate any dialog you are already editing for another reason.

`SessionTimeoutModal` and `QuotaExceededModal` should migrate with
`closeOnEscape={false}` and `showCloseButton={false}` — they are blocking
prompts that must be answered rather than dismissed.
