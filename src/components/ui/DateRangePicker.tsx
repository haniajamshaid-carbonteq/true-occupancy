/* global React, Icon */
// DateRangePicker — labelled From / To range with optional quick presets.
//
// Visual contract:
//  - Eyebrow label matches ChipRow so it slots into the same filter drawer.
//  - Preset chips reuse the chip pattern from ChipRow (h-8, rounded-md,
//    brand-tint active, brand-deep ink).
//  - Date inputs reuse the Input.tsx surface (rounded-lg, border-line,
//    brand focus ring, shadow-sm) at a tighter h-9 so two fit on one row
//    inside a drawer.
//
// Values are ISO strings ('YYYY-MM-DD') or empty for "open-ended". Either
// side may be empty — the consumer decides what an open range means.

interface DateRange {
  from?: string;
  to?: string;
}

interface DatePreset {
  /** Stable identifier — also used for active-state matching. */
  id: string;
  label: string;
  /** Range this preset represents. Empty string ≡ unset. */
  range: DateRange;
}

interface DateRangePickerProps {
  label?: string;
  value: DateRange;
  onChange: (next: DateRange) => void;
  /** Earliest selectable date (YYYY-MM-DD). */
  min?: string;
  /** Latest selectable date (YYYY-MM-DD). Defaults to today. */
  max?: string;
  /** Optional quick-pick chips above the inputs. */
  presets?: DatePreset[];
  /** Render label as an eyebrow (filter drawer) vs. a form label (inline). */
  labelStyle?: 'eyebrow' | 'form';
}

function isSameRange(a: DateRange, b: DateRange): boolean {
  return (a.from || '') === (b.from || '') && (a.to || '') === (b.to || '');
}

function isRangeSet(r: DateRange): boolean {
  return Boolean(r.from || r.to);
}

function DateRangePicker({
  label,
  value,
  onChange,
  min,
  max,
  presets,
  labelStyle = 'eyebrow',
}: DateRangePickerProps) {
  const today = max ?? new Date().toISOString().slice(0, 10);
  const fromId = React.useId ? React.useId() : 'dr-from';
  const toId = React.useId ? React.useId() : 'dr-to';

  // If the user picks a "from" later than "to", snap "to" forward so the
  // range stays valid without losing their intent.
  function setFrom(next: string) {
    if (next && value.to && next > value.to) {
      onChange({ from: next, to: next });
    } else {
      onChange({ ...value, from: next || undefined });
    }
  }
  function setTo(next: string) {
    if (next && value.from && next < value.from) {
      onChange({ from: next, to: next });
    } else {
      onChange({ ...value, to: next || undefined });
    }
  }

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <div
            className={
              labelStyle === 'eyebrow'
                ? 'font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase'
                : 'font-sans text-caption font-semibold'
            }
            style={{ color: labelStyle === 'eyebrow' ? 'var(--ink-3)' : 'var(--ink-2)' }}
          >
            {label}
          </div>
          {isRangeSet(value) && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="font-sans text-micro font-semibold hover:underline"
              style={{ color: 'var(--brand-deep)' }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          {presets.map((p) => {
            const active = isSameRange(value, p.range);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p.range)}
                className={`inline-flex items-center gap-inline h-8 px-control-x rounded-md border text-caption font-medium transition-colors duration-200 ${
                  active
                    ? '!bg-brand-tint !border-brand/40'
                    : 'bg-surface border-line hover:bg-hover-bg hover:border-line-strong'
                }`}
                style={{ color: active ? 'var(--brand-deep)' : 'var(--ink-2)' }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <DateField
          id={fromId}
          ariaLabel="From date"
          value={value.from || ''}
          onChange={setFrom}
          min={min}
          max={value.to || today}
        />
        <span
          aria-hidden
          className="font-sans text-caption shrink-0"
          style={{ color: 'var(--ink-4)' }}
        >
          —
        </span>
        <DateField
          id={toId}
          ariaLabel="To date"
          value={value.to || ''}
          onChange={setTo}
          min={value.from || min}
          max={today}
        />
      </div>
    </div>
  );
}

interface DateFieldProps {
  id: string;
  ariaLabel: string;
  value: string;
  onChange: (next: string) => void;
  min?: string;
  max?: string;
}

function DateField({ id, ariaLabel, value, onChange, min, max }: DateFieldProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      className="flex-1 min-w-0 flex items-center rounded-lg transition-shadow"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${focused ? 'var(--brand)' : 'var(--line)'}`,
        boxShadow: focused
          ? '0 0 0 3px var(--brand-soft), var(--shadow-sm)'
          : 'var(--shadow-sm)',
      }}
    >
      <span
        className="grid w-8 h-9 place-items-center shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5"
        style={{ color: 'var(--ink-3)' }}
        aria-hidden
      >
        <Icon name="cal" size={14} />
      </span>
      <input
        id={id}
        type="date"
        aria-label={ariaLabel}
        value={value}
        min={min}
        max={max}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 min-w-0 bg-transparent border-0 outline-none h-9 pr-2 text-caption font-sans tabular-nums"
        style={{ color: value ? 'var(--ink)' : 'var(--ink-4)' }}
      />
    </div>
  );
}
