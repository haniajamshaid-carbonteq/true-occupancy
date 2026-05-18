/* global React */
// ReferenceCell — inline-editable Reference field for table rows.
//
// Read state:
//   - With value: shows the value truncated to a reasonable max width,
//                 full value on hover (title attr).
//   - Empty: shows a muted "+ Add reference" only on row hover (caller is
//                 responsible for adding the group/group-hover class to
//                 the surrounding row; we use `opacity-0 group-hover:opacity-100`).
//
// Edit state (click the read cell):
//   - Replaces the read affordance with a focused input pre-filled with the
//     current value.
//   - Enter, blur, or click-outside: saves via onSave (whitespace-only is
//     treated as cleared per the design spec).
//   - Escape: cancels, leaves the previous value untouched.
//   - Soft cap 100 chars via maxLength (server enforces the hard limit).
//
// Stops row-click propagation so clicking the cell doesn't also drill into
// the property detail page.

interface ReferenceCellProps {
  /** Current saved reference, or undefined when none. */
  value?: string;
  /** Called with the new value (or undefined when cleared). Caller fires
   *  the toast + optimistic update. Should not throw — this cell is fire-
   *  and-forget; revert via a re-render with a different `value`. */
  onSave: (next?: string) => void;
  /** Read-only mode disables click-to-edit entirely (e.g. a row whose
   *  scan failed and is being retried). Default: false. */
  readOnly?: boolean;
  /** Tightens the visible width when used in narrow columns. Default 180. */
  maxWidth?: number;
}

function ReferenceCell({ value, onSave, readOnly, maxWidth = 180 }: ReferenceCellProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string>(value ?? '');
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (editing) {
      // Defer focus to next tick so the input is mounted.
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [editing]);

  // Whenever the saved value changes externally (optimistic revert,
  // server reconciliation, etc.) refresh the draft so re-opening the
  // editor shows the latest.
  React.useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  function commit() {
    const next = draft.trim() ? draft.trim() : undefined;
    if (next !== value) onSave(next);
    setEditing(false);
  }

  function cancel() {
    setDraft(value ?? '');
    setEditing(false);
  }

  // Read mode ---------------------------------------------------------------
  if (!editing) {
    if (readOnly) {
      // Static display, no click-to-edit.
      return value ? (
        <span
          className="inline-block font-mono tabular-nums text-caption text-ink-2 truncate align-middle"
          style={{ maxWidth }}
          title={value}
        >
          {value}
        </span>
      ) : (
        <span className="text-ink-4 text-caption">—</span>
      );
    }

    return value ? (
      <button
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="inline-block w-full text-left font-mono tabular-nums text-caption text-ink-2 truncate align-middle bg-transparent border-0 p-0 cursor-text hover:text-ink"
        style={{ maxWidth }}
        title={value}
      >
        {value}
      </button>
    ) : (
      // Empty cell: subtle "+ Add reference" that's always visible but
      // muted so it doesn't compete with populated rows. Hover brightens
      // it to communicate clickability.
      <button
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="inline-flex items-center gap-1 font-sans text-caption text-ink-4 hover:text-ink-2 focus:text-ink-2 bg-transparent border-0 p-0 cursor-text transition-colors"
      >
        <span aria-hidden>+</span>
        <span>Add reference</span>
      </button>
    );
  }

  // Edit mode ---------------------------------------------------------------
  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      maxLength={100}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        }
      }}
      placeholder="LOAN-2026-0042"
      aria-label="Reference"
      className="font-mono tabular-nums text-caption bg-surface border border-brand rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-brand-soft"
      style={{ width: maxWidth }}
    />
  );
}
