# Motion

The whole motion system in one file: values, the recipes built from them, and the philosophy governing how much motion is right. Loaded only for animation tasks.

**Rules:**
- Values are motion tokens. Enter/exit patterns are conventions built from them. Philosophy is prose.
- **Patterns reference tokens by name, never raw values.**
- Values carry an **intended use**, not just a number — otherwise people pick whatever feels right and the scale drifts.
- Motion tied to a component's own state (a button's hover transition) lives in that component's file, not here.

**Source of truth:** [`src/styles/motion.css`](../../src/styles/motion.css). Dock motion is additionally specced in [`docs/DESIGN.md`](../../docs/DESIGN.md) §14.6.

---

## Duration

The intended three-tier scale:

```
--motion-fast:  200ms   use: route transitions, quick fades
--motion-mid:   360ms   use: panel and card entrances
--motion-slow:  600ms   use: reserved for the longest deliberate reveals
```

Plus the durations that were previously hardcoded in the keyframe utilities. They are now named **at their exact shipped values**, so nothing re-timed:

```
--motion-exit:      160ms   toast-out
--motion-enter:     220ms   toast-in, dock-out
--motion-morph:     280ms   dock collapsed <-> expanded
--motion-snap:      320ms   verdict-pulse, status-text-in, dock-in
--motion-rise:      380ms   card-rise, ribbon-drop
--motion-attention: 700ms   mismatch-pulse
--motion-draw:      900ms   sparkline-draw
```

Ambient loops — infinite, never tied to an interaction:

```
--motion-loop-sm: 1200ms   status-dot-bounce
--motion-loop-md: 1400ms   skeleton-pulse
--motion-loop-lg: 1600ms   status-text-shimmer
--motion-loop-xl: 2400ms   marker-breathe, ai-cta-spark-pulse
```

> ⚠ **This is named drift, not a resolved scale.** Eleven durations is more than a system needs. They were tokenized at their existing values so the refactor stayed visually neutral — collapsing them into `fast` / `mid` / `slow` changes timing, which is a design decision, not a refactor. **Open for the owner.** Until then: reach for `fast` / `mid` / `slow` in new work, and only use a named one to match an existing behaviour.

## Stagger

```
--stagger: 160ms   the gap between items animating in sequence
```

## Delay

No named delay tokens exist. Delays are applied inline where used:

```
ribbon-drop:       240ms   before the ribbon drops
mismatch-pulse:    900ms   after reveal, so the pulse reads as a second beat
sparkline-draw:     80ms
sparkline-fill-in:  760ms  after the line finishes drawing
status-dots:       160ms / 320ms stagger across the three dots
```

## Easing

```
--ease-out:     cubic-bezier(.16, 1, .3, 1)     use: things entering
--ease-in-out:  cubic-bezier(.65, 0, .35, 1)    use: things moving or leaving in place
--ease-spring:  cubic-bezier(.34, 1.2, .64, 1)  use: things that should land with a little weight
```

`--ease-spring` overshoots slightly. Reserve it for arrivals that deserve emphasis — the dock, the verdict, the ribbon. Not for routine transitions.

## Spring

No physics-preset springs. `--ease-spring` above is the sole spring-flavoured curve, expressed as a bezier.

The one real stagger in the system is the status-dots sequence. Its third dot sits at 320ms — 2 × `--stagger` — which is left as a literal because a multiplied token reads worse than the number.

---

## Enter/exit patterns

Every named animation in the system, grouped by what it belongs to. Durations shown as they exist in source (see the drift note above).

**Route / page**
```
route-fade-in:  opacity 0 → 1, ease-out, motion-fast, `both`
```
Opacity-only, deliberately. A `translateY` would create a containing block for `position: fixed` descendants (the SideNav rail), breaking sticky-pinning to the viewport. The fade alone reads smooth enough without the 8px lift. **Do not add a transform to this.**

**Cards & content**
```
card-rise:      380ms ease-out, `both`      — reduced-motion: none, opacity 1
ribbon-drop:    380ms ease-spring, 240ms delay
verdict-pulse:  320ms ease-spring
```

**Notification dock** (DESIGN.md §14.6)
```
dock-in:       320ms ease-spring   — opacity 0→1, translateY -8→0, scale .92→1
dock-out:      220ms ease-in-out   — reverse
dock-shimmer:  sweeps the active StepProgress segment, infinite
collapsed ↔ expanded: CSS transition on width / height / radius, 280ms ease-spring
```
Implementation note: React currently swaps `<Pill>` for `<Stack>` rather than morphing one element. The morph is a planned upgrade, not shipped.

**Toast**
```
toast-in:   220ms ease-out
toast-out:  160ms ease-in-out
```

**Loading & thinking**
```
ai-spin:         the shared "thinking" spinner — dock and AICtaButton use the same one on purpose
skeleton-pulse:  1400ms ease-in-out infinite  — reduced-motion: none, opacity .7
status-text-shimmer: 1600ms ease-in-out infinite
status-dot-bounce:   1200ms ease-in-out infinite, 160ms stagger
```

**Data viz**
```
sparkline-draw:     900ms ease-out, 80ms delay   (stroke-dashoffset)
sparkline-fill-in:  360ms ease-out, 760ms delay  (area under the line)
marker-breathe:     2400ms ease-in-out infinite
```

**Attention**
```
mismatch-pulse:       700ms ease-in-out, 900ms delay
mismatch-pulse-fail:  700ms ease-in-out, 900ms delay
```

**AI CTA**
```
ai-cta-spark-pulse:  2400ms ease-in-out infinite
ai-cta-sheen:        6.5s ease-in-out infinite  — hover lifts the halo
ai-scan-beam:        soft teal halo sweeping top→bottom along the timeline rail
ai-scan-line-pulse:  keeps the connector line alive between substep ticks
```

## Reduced motion

`@media (prefers-reduced-motion: reduce)` is honoured throughout: transforms and animations are stripped, **opacity is preserved**. Explicit handling exists for `.card-rise`, `.skeleton-pulse`, `.sparkline-*`, `.notification-dock`, and `.ai-cta`.

**Any new animation must ship its reduced-motion fallback in the same change.**

---

## Philosophy

Motion is reserved for moments that *mean* something — the result reveal, a new attention call, a route transition. Hover polish lives in component CSS, not here. Animations stay calm by default: this audience is making compliance decisions, and a surface that fidgets reads as less trustworthy than one that holds still.

The dock and the AI CTA share one spinner (`ai-spin`) so "the system is thinking" has a single motion language wherever it appears.
