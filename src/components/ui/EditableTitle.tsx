/* global React, Icon */
// EditableTitle — inline-editable text primitive used by the batch results
// header for both the batch title (h1) and its description (body-sm). Mirrors
// ReferenceCell's interaction model (click to edit, Enter/blur saves, Esc
// cancels) but presents as ambient page copy until hovered or focused so the
// batch page reads as a finished document, not a forms checklist.
//
// Brand alignment (docs/DESIGN.md):
//   §13.2 type ramp — title pulls h3 (16 px navy semibold) on cards and h1
//     (~28–32 px navy semibold, -0.008 em) at page-header scale.
//   §13.3 surfaces — focus ring uses brand-soft so the active edit feels
//     like the same warm-teal confirmation as the rest of the form system
//     (matches Input.tsx exactly).
//   §13.7 brand-preservation — placeholder copy stays sentence case, no
//     marketing voice, no "Click to edit" verbiage in the ambient state.

type Variant = 'h1' | 'h3' | 'body-sm';

interface EditableTitleProps {
  value?: string;
  /** Fires on Enter or blur with the trimmed new value. Not called when the
   *  value is unchanged. For multiline variants Shift+Enter inserts a newline
   *  rather than committing. */
  onSave: (next: string) => void;
  /** Renders when `value` is empty / undefined. Italic, ink-4 — visually
   *  recedes so the page doesn't read "incomplete" by default. */
  placeholder?: string;
  /** Switches to <textarea>; Enter still commits, Shift+Enter newlines. */
  multiline?: boolean;
  /** Soft cap (no hard truncation — we just stop accepting input). */
  maxLength?: number;
  variant?: Variant;
  /** Accessible label for the underlying input when no visible label exists. */
  ariaLabel?: string;
  /** Disables the click-to-edit affordance so the text reads as an
   *  immutable record. (Batch title/description are editable everywhere, so
   *  they no longer set this — kept as a generic capability of the primitive.) */
  readOnly?: boolean;
  /** When true and `value` is empty, hide the field entirely instead of
   *  showing the placeholder ghost — for surfaces where empty means "omit
   *  the row" rather than "invite an edit". */
  hideWhenEmpty?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  h1: 'font-sans font-semibold text-h3 leading-[1.1] tracking-[-0.012em] m-0',
  h3: 'font-sans font-semibold text-h3 leading-tight tracking-[-0.005em] m-0',
  // Description sits on body-sm with relaxed leading so it reads as a
  // companion paragraph to the title, not a UI sub-line.
  'body-sm': 'font-sans text-body-sm leading-relaxed m-0',
};

const VARIANT_INPUT_CLASS: Record<Variant, string> = {
  h1: 'font-sans font-semibold text-h3 leading-[1.1] tracking-[-0.012em]',
  h3: 'font-sans font-semibold text-h3 leading-tight tracking-[-0.005em]',
  'body-sm': 'font-sans text-body-sm leading-relaxed',
};

function EditableTitle({
  value,
  onSave,
  placeholder = 'Untitled',
  multiline = false,
  maxLength,
  variant = 'h3',
  ariaLabel,
  readOnly = false,
  hideWhenEmpty = false,
}: EditableTitleProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? '');
  // Two refs because TS doesn't let a single MutableRefObject straddle
  // HTMLInputElement | HTMLTextAreaElement cleanly in this no-build setup.
  // Matches the per-element ref pattern in CommandSearch / ReferenceCell.
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const initialValueRef = React.useRef(value ?? '');

  React.useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  function beginEdit() {
    if (readOnly) return;
    initialValueRef.current = value ?? '';
    setDraft(value ?? '');
    setEditing(true);
    // Focus + select on next paint so the user can overwrite immediately.
    window.requestAnimationFrame(() => {
      const el = multiline ? textareaRef.current : inputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    });
  }

  function commit() {
    const next = draft.trim();
    const prev = initialValueRef.current.trim();
    setEditing(false);
    if (next !== prev) onSave(next);
  }

  function cancel() {
    setDraft(initialValueRef.current);
    setEditing(false);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }

  const isEmpty = !value || !value.trim();

  // Ambient (not editing) — clickable text. When empty, falls back to ghost
  // placeholder copy; hideWhenEmpty silences the row entirely. Pencil shows
  // only on hover/focus so the page reads as ambient document copy, not a
  // settings form.
  if (!editing) {
    if (isEmpty && hideWhenEmpty) return null;

    const navyInk = { color: 'var(--navy)' };
    const ghostInk = { color: 'var(--ink-4)', fontStyle: 'italic' as const };
    const bodyInk = { color: 'var(--ink-2)' };

    const ink =
      variant === 'body-sm'
        ? isEmpty
          ? ghostInk
          : bodyInk
        : isEmpty
        ? ghostInk
        : navyInk;

    return (
      <button
        type="button"
        onClick={beginEdit}
        disabled={readOnly}
        aria-label={ariaLabel ?? (isEmpty ? `Add ${placeholder.toLowerCase()}` : 'Edit')}
        className={`group inline-flex items-baseline gap-2 max-w-full text-left rounded-md -mx-2 -my-1 px-2 py-1 transition-colors hover:bg-hover-bg disabled:cursor-default disabled:hover:bg-transparent`}
      >
        <span className={`${VARIANT_CLASS[variant]} truncate`} style={ink}>
          {isEmpty ? placeholder : value}
        </span>
        {!readOnly && (
          <span
            className="inline-flex shrink-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity [&>svg]:w-3.5 [&>svg]:h-3.5"
            style={{ color: 'var(--ink-3)' }}
            aria-hidden
          >
            <Icon name="pencil" size={14} />
          </span>
        )}
      </button>
    );
  }

  // Editing — input/textarea swap in. Border + focus ring mirror Input.tsx
  // (brand-soft glow, brand border) so the affordance feels native to the
  // rest of the form system.
  const sharedInputCls = `block w-full bg-surface border rounded-md px-2 py-1.5 outline-none transition-shadow ${VARIANT_INPUT_CLASS[variant]}`;
  const inputStyle: React.CSSProperties = {
    color: variant === 'body-sm' ? 'var(--ink-2)' : 'var(--navy)',
    borderColor: 'var(--brand)',
    boxShadow: '0 0 0 3px var(--brand-soft), var(--shadow-sm)',
  };

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        className={sharedInputCls + ' resize-none'}
        style={inputStyle}
        value={draft}
        rows={2}
        maxLength={maxLength}
        aria-label={ariaLabel ?? placeholder}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      className={sharedInputCls}
      style={inputStyle}
      value={draft}
      maxLength={maxLength}
      aria-label={ariaLabel ?? placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKey}
    />
  );
}
