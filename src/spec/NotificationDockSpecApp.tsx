/* global React, SpecSection, MockAppStateProvider, NotificationDock */
// Dedicated states canvas for the Notification Dock.
//
// Background: the Section 07 frames in StatesSpecApp.tsx use a 240-pixel
// fixed-height stage with overflow: hidden, which crops every expanded /
// multi-task state. This file rebuilds the same 13 states inside
// generously-sized, overflow-visible stages so every variant reads in
// full — single pill, expanded accordion, and the hover / focus rings.
//
// All notification fixtures are copies of the originals so the two
// canvases stay visually equivalent for non-clipped states.

// ── Stage primitive ─────────────────────────────────────────────────────
// Sized per-state via the `tall` flag. Single-task collapsed pills fit
// inside the standard stage; expanded / multi-task variants opt into the
// taller stage. overflow:visible everywhere — the dock floats out of the
// stage if anything still pokes through, which is the right failure mode
// for a design canvas (loud, not silent).

interface DockStageProps {
  label: string;
  title: string;
  desc?: string;
  /** Use the taller stage. Default false. Set true for expanded /
   *  multi-task / countdown-ring states. */
  tall?: boolean;
  children: React.ReactNode;
}

function DockStage({ label, title, desc, tall = false, children }: DockStageProps) {
  return (
    <div className="screen-wrap" style={{ width: 600 }}>
      <div className="screen-meta">
        <span className="label">{label}</span>
        <h3>{title}</h3>
        {desc && <div className="desc">{desc}</div>}
      </div>
      <div
        className="screen-frame"
        style={{
          position: 'relative',
          minHeight: tall ? 520 : 360,
          background:
            'linear-gradient(180deg, var(--bg) 0%, #ECEEF2 60%, #E4E7EC 100%)',
          overflow: 'visible',
        }}
      >
        {/* Dimmed page snippet — proves the dock floats above content
            without pushing layout. Kept lighter than the original so the
            dock itself stays the visual centre. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            padding: tall ? '152px 40px 28px' : '120px 40px 28px',
            opacity: 0.45,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 92, height: 12, borderRadius: 4, background: 'var(--line-strong)' }} />
            <div style={{ width: 44, height: 8, borderRadius: 4, background: 'var(--line)' }} />
          </div>
          <div
            style={{
              height: 96,
              borderRadius: 14,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ width: '60%', height: 10, borderRadius: 4, background: 'var(--line-strong)' }} />
            <div style={{ width: '40%', height: 8, borderRadius: 4, background: 'var(--line)' }} />
            <div style={{ width: '85%', height: 8, borderRadius: 4, background: 'var(--line)' }} />
          </div>
        </div>

        {/* Wrap NotificationDock in a MockAppStateProvider so the
            spec-gallery flavour of the dock can safely consume any
            useAppState() touches without a live provider. The notifications
            prop forces the gallery branch regardless of provider state. */}
        <MockAppStateProvider value={{}}>
          {children}
        </MockAppStateProvider>
      </div>
    </div>
  );
}

// ── Spec entry ──────────────────────────────────────────────────────────

function NotificationDockSpecApp() {
  return (
    <div className="spec-canvas">
      <nav className="nav-anchor">
        <span className="brand">True Occupancy · Notification Dock</span>
        <a href="#section-01">Empty</a>
        <a href="#section-02">Batch — single task</a>
        <a href="#section-03">AI Investigator</a>
        <a href="#section-04">Multiple tasks</a>
        <a href="#section-05">Interaction</a>
      </nav>

      <header className="spec-header">
        <div className="eyebrow">Halcyon · True Occupancy</div>
        <h1>Notification Dock <em>states</em></h1>
        <p>
          Every state of the dock, rendered in stages tall enough for the
          expanded and multi-task variants to read in full. The dock is the
          single morphing surface that owns every long-running task — batch
          scans, AI investigations, transient toasts — across the platform.
          Pinned top-centre, sits outside page layout, dismissible.
        </p>
      </header>

      {/* ============================================================== */}
      <SpecSection num="01" title="Empty" desc="The dock takes zero layout when no task is in flight — page content sits exactly where it would without notifications.">
        <DockStage label="01.1" title="Empty / hidden" desc="No active tasks. Nothing pinned.">
          <NotificationDock notifications={[]} contained />
        </DockStage>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="02" title="Batch — single task" desc="One batch in flight. Collapsed pill, brand spinner, live X / Y counter, gradient rail along the bottom edge.">
        <DockStage label="02.1" title="Scanning" desc="Collapsed pill, brand spinner, 4 / 12 mono counter, 2px gradient rail along the bottom edge.">
          <NotificationDock
            contained
            notifications={[{
              id: 'b1', kind: 'batch', status: 'running',
              title: 'Batch · 2025-Q1 STRs',
              progress: { kind: 'count', done: 4, total: 12 },
              startedAt: Date.now() - 30_000,
            }]}
          />
        </DockStage>

        <DockStage label="02.2" title="Completed" desc="Green check with a 6-second countdown ring (paused at ~50%). Auto-dismisses on success; errors persist." tall>
          <NotificationDock
            contained
            forcedExpanded={false}
            notifications={[{
              id: 'b2', kind: 'batch', status: 'completed',
              title: 'Batch · 2025-Q1 STRs',
              meta: '12 / 12 scanned',
              startedAt: Date.now() - 60_000,
              finishedAt: Date.now() - 3_000,
              autoDismissAt: Date.now() + 3_000,
              _countdown: 0.5,
              primaryAction: { label: 'View results' },
            } as any]}
          />
        </DockStage>

        <DockStage label="02.3" title="Completed with errors" desc="Amber accent. Shown expanded so the partial counts and both actions read at a glance." tall>
          <NotificationDock
            contained
            forcedExpanded
            notifications={[{
              id: 'b3', kind: 'batch', status: 'completed-errors',
              title: 'Batch · 2025-Q1 STRs',
              meta: '9 / 12 scanned · 3 failed',
              failed: 3,
              startedAt: Date.now() - 120_000,
              finishedAt: Date.now() - 4_000,
              primaryAction: { label: 'View results' },
              secondaryAction: { label: 'Retry failed' },
            }]}
          />
        </DockStage>

        <DockStage label="02.4" title="Error" desc="Clay-red. Persists until the user acts. Retry / partial-results actions live in the expanded view." tall>
          <NotificationDock
            contained
            forcedExpanded
            notifications={[{
              id: 'b4', kind: 'batch', status: 'error',
              title: 'Batch · 2025-Q1 STRs',
              meta: 'Stopped at row 7 of 12',
              startedAt: Date.now() - 90_000,
              finishedAt: Date.now() - 2_000,
              primaryAction: { label: 'Retry batch' },
              secondaryAction: { label: 'View partial' },
            }]}
          />
        </DockStage>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="03" title="AI Investigator" desc="Deep two-step analysis on a single scan result. Same shape as batch states; the rail shows step progress instead of a count.">
        <DockStage label="03.1" title="Step 1 of 2" desc="Two-segment shimmer rail with the first segment active. Replaces the full-width inline LoadingCard.">
          <NotificationDock
            contained
            notifications={[{
              id: 'ai1', kind: 'ai-investigator', status: 'running',
              title: 'AI investigation',
              meta: 'Retrieving listings',
              progress: { kind: 'step', step: 1, of: 2 },
              startedAt: Date.now() - 1_200,
            }]}
          />
        </DockStage>

        <DockStage label="03.2" title="Step 2 of 2" desc="First segment filled, second segment shimmering. Total perceived run ~3 s.">
          <NotificationDock
            contained
            notifications={[{
              id: 'ai2', kind: 'ai-investigator', status: 'running',
              title: 'AI investigation',
              meta: 'Cross-checking signals',
              progress: { kind: 'step', step: 2, of: 2 },
              startedAt: Date.now() - 2_400,
            }]}
          />
        </DockStage>

        <DockStage label="03.3" title="Error" desc="Network / upstream failure. Stays visible; one tap to retry without leaving the result page." tall>
          <NotificationDock
            contained
            forcedExpanded
            notifications={[{
              id: 'ai3', kind: 'ai-investigator', status: 'error',
              title: 'AI investigation',
              meta: 'Network error · request timed out',
              startedAt: Date.now() - 8_000,
              finishedAt: Date.now() - 200,
              primaryAction: { label: 'Retry investigation' },
            }]}
          />
        </DockStage>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="04" title="Multiple tasks" desc="Two or more tasks in flight. The dock collapses into an aggregate chip; the accordion expands on click to surface each task with its own state.">
        <DockStage label="04.1" title="2 tasks · collapsed" desc="Aggregate chip shows the count + stacked-dots glyph + chevron — the affordance to expand.">
          <NotificationDock
            contained
            notifications={[
              { id: 'b5', kind: 'batch', status: 'running',
                title: 'Batch · 2025-Q1 STRs',
                progress: { kind: 'count', done: 7, total: 24 },
                startedAt: Date.now() - 40_000 },
              { id: 'ai4', kind: 'ai-investigator', status: 'running',
                title: 'AI investigation',
                progress: { kind: 'step', step: 1, of: 2 },
                startedAt: Date.now() - 1_500 },
            ]}
          />
        </DockStage>

        <DockStage label="04.2" title="2 tasks · expanded" desc="Accordion shell. Header summarises 'N running · N done · N failed'; each row carries its own title, meta, progress, actions." tall>
          <NotificationDock
            contained
            forcedExpanded
            notifications={[
              { id: 'b6', kind: 'batch', status: 'running',
                title: 'Batch · 2025-Q1 STRs',
                meta: '7 / 24 scanned',
                progress: { kind: 'count', done: 7, total: 24 },
                startedAt: Date.now() - 40_000 },
              { id: 'ai5', kind: 'ai-investigator', status: 'running',
                title: 'AI investigation',
                meta: 'Cross-checking signals · Step 2 of 2',
                progress: { kind: 'step', step: 2, of: 2 },
                startedAt: Date.now() - 2_400 },
            ]}
          />
        </DockStage>

        <DockStage label="04.3" title="3 tasks · mixed states" desc="One running, one done (with View results), one errored (with Retry). Demonstrates how the dock coordinates several concurrent jobs without page chrome stacking up." tall>
          <NotificationDock
            contained
            forcedExpanded
            notifications={[
              { id: 'b7', kind: 'batch', status: 'running',
                title: 'Batch · 2025-Q1 STRs',
                meta: '11 / 24 scanned',
                progress: { kind: 'count', done: 11, total: 24 },
                startedAt: Date.now() - 55_000 },
              { id: 'ai6', kind: 'ai-investigator', status: 'completed',
                title: 'AI investigation',
                meta: '1428 Maplewood Drive · AI confirms verdict',
                startedAt: Date.now() - 8_000,
                finishedAt: Date.now() - 1_000,
                primaryAction: { label: 'View result' } },
              { id: 'b8', kind: 'batch', status: 'error',
                title: 'Batch · feb-export.csv',
                meta: 'Stopped at row 3 of 18',
                startedAt: Date.now() - 30_000,
                finishedAt: Date.now() - 500,
                primaryAction: { label: 'Retry batch' },
                secondaryAction: { label: 'View partial' } },
            ]}
          />
        </DockStage>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="05" title="Interaction" desc="Hover and keyboard focus states — affordances that survive screen review.">
        <DockStage label="05.1" title="Hover (collapsed)" desc="Scale-up 1.02 plus a slightly larger shadow. The pill grows toward the user without crowding the page.">
          <NotificationDock
            contained
            forceHover
            notifications={[{
              id: 'b9', kind: 'batch', status: 'running',
              title: 'Batch · 2025-Q1 STRs',
              progress: { kind: 'count', done: 4, total: 12 },
              startedAt: Date.now() - 30_000,
            }]}
          />
        </DockStage>

        <DockStage label="05.2" title="Keyboard focus" desc="White focus ring at 2px / 60% alpha. Esc collapses · Enter / Space expands · arrow keys traverse rows once expanded.">
          <NotificationDock
            contained
            forceFocused
            notifications={[{
              id: 'b10', kind: 'batch', status: 'running',
              title: 'Batch · 2025-Q1 STRs',
              progress: { kind: 'count', done: 4, total: 12 },
              startedAt: Date.now() - 30_000,
            }]}
          />
        </DockStage>
      </SpecSection>
    </div>
  );
}
