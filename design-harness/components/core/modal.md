name: modal
status: draft
version: 1
extends: none
class: Overlay

## Anatomy
- `src/components/ui/Modal.tsx` — portal-rendered into `<body>` via `ReactDOM.createPortal`.
- Positioner: `fixed inset-0 z-[100]` (⚠ hardcoded in source), flex-centered, `p-4` gutter.
- Backdrop: `bg-ink/40` + `backdrop-blur-sm`, click-to-close.
- Dialog: `bg-surface`, 1px `--line` border, `rounded-lg` (`--r-lg`), `--shadow-md`,
  `maxWidth` = `width` prop (default 480 ⚠ hardcoded in source).
- Header (only when `title`): H4 in `--navy` + `x` close button; `border-b --line`;
  padding `px-surface-x` / `py-surface-y-h` → `--pad-surface-x` / `--pad-surface-y-header`.
- Body: `px-surface-x` / `py-surface-y-b` → `--pad-surface-x` / `--pad-surface-y-body`.
- Footer (only when `footer`): right-aligned actions, `border-t --line`, `bg-surface-2/40`,
  `px-surface-x` / `py-surface-y-f` → `--pad-surface-x` / `--pad-surface-y-footer`.
- Consumer: `src/components/AutomateModal.tsx` (`width` 600 batch / 520 single ⚠ hardcoded).
- Siblings on the same surface contract: `src/components/ui/Drawer.tsx` (right-anchored,
  `maxWidth` 380 default, `drawer-slide-in` 220ms, body is `flex-1 overflow-y-auto`) and its
  consumer `src/components/result/SavedSnapshotDrawer.tsx`.

## States
- open — mounts only while `open` is true. Backdrop `route-fade-in 160ms var(--ease-out)`,
  dialog `route-fade-in 200ms var(--ease-out)` (⚠ durations hardcoded; `--motion-fast` is 200ms).
  Body scroll locked (`document.body.style.overflow = 'hidden'`). Focus moves to the first
  focusable inside the dialog, else the dialog itself (`tabIndex={-1}`). `role="dialog"`,
  `aria-modal="true"`, `aria-labelledby` wired to the title id when a title exists.
- closing / dismiss — ⚠ NO EXIT ANIMATION in source: returns `null` the instant `open` flips
  false. Dismiss paths: ESC (`preventDefault` + `onClose`), backdrop click, header close button,
  footer action. On unmount the scroll lock is restored and focus returns to the previously
  active element.
- overflow — ⚠ NOT IMPLEMENTED in source. The dialog has no `max-height` and the body has no
  `overflow-y`; tall content grows past the viewport while page scroll is already locked.
  (`Drawer.tsx` does scroll its body — the two diverge here.)

## Variants
none — one shape, parameterised by `width`, `title`, `footer`, `labelId`.

## Rules
- Must render through the portal, never inline. `z-[100]` assumes it clears SideNav (`z-30/40/50`).
- Must use the `--pad-surface-*` tokens for header / body / footer padding. They exist
  specifically for modal + drawer surfaces; do not substitute raw `--space-*`.
- Focus trap is manual (Tab / Shift+Tab wrap first↔last focusable inside `dialogRef`). Anything
  focusable rendered outside that ref is unreachable by keyboard.
- Per DESIGN.md §13.3 shadow is for elevated chrome only — modals may carry `--shadow-md`;
  resting cards may not.
- Destructive confirmations (e.g. "Cancel Automation?" in `src/components/AutomationControl.tsx`)
  put the destructive action in the footer with `border-error-soft bg-error-soft text-error-ink`;
  the safe choice is `variant="ghost"` and sits first.
- Mobile: no separate mobile treatment — the `p-4` gutter plus `w-full` + `maxWidth` is the whole
  responsive story. Unlike `DropdownMenu`, the modal does not become a bottom sheet.

## Revisions
- r1: transcribed from `src/components/ui/Modal.tsx`, `src/components/AutomateModal.tsx`,
  `src/components/ui/Drawer.tsx`, `src/components/AutomationControl.tsx`,
  `src/styles/tokens.css`, `src/styles/motion.css`, `tailwind.config.js`,
  `docs/DESIGN.md` §13.3 into harness format.
