/* global React, ReactRouterDOM, NotificationPill, NotificationStack,
   useAppState, useAIInvestigator, startAIInvestigation */
// NotificationDock — top-of-viewport Dynamic-Island-style surface that
// owns every long-running task.
//
// Two flavours:
//   • Spec gallery: pass `notifications` (and optional forced* flags) to
//     render a frozen frame outside any AppStateProvider.
//   • Production: omit `notifications` — <LiveDock> subscribes to the
//     live `useAppState().liveBatch` + `useAIInvestigator()` bus and
//     derives the notification list itself.

// ── Derivation from live state ─────────────────────────────────────────
// Actions are wired here so each notification carries real handlers; the
// row component stays purely presentational.
function deriveBatchNotification(
  liveBatch: any,
  navigate: (href: string) => void,
  dismissBatch: (() => void) | undefined,
): any | null {
  if (!liveBatch || liveBatch.dismissed) return null;
  const rows = liveBatch.rows || [];
  const total = rows.length;
  const done = rows.filter((r: any) => r.status === 'done' || r.status === 'failed').length;
  const failed = rows.filter((r: any) => r.status === 'failed').length;
  const isComplete = liveBatch.status === 'complete';

  let status: 'running' | 'completed' | 'completed-errors' | 'error' = 'running';
  if (isComplete) {
    status = failed === 0 ? 'completed' : failed >= total ? 'error' : 'completed-errors';
  }

  const href = `/batch/${liveBatch.historyId || liveBatch.id}`;
  const goToBatch = () => {
    navigate(href);
    dismissBatch?.();
  };

  return {
    id: liveBatch.id,
    kind: 'batch',
    status,
    title: `Batch · ${liveBatch.filename}`,
    meta: isComplete
      ? `${done - failed} / ${total} scanned${failed > 0 ? ` · ${failed} failed` : ''}`
      : `${done} / ${total} scanned`,
    progress: isComplete ? undefined : { kind: 'count', done, total },
    failed,
    href,
    startedAt: liveBatch.startedAt,
    finishedAt: isComplete ? Date.now() : undefined,
    autoDismissAt:
      isComplete && status === 'completed' ? Date.now() + 6000 : undefined,
    primaryAction:
      isComplete && status !== 'error'
        ? { label: 'View results', onClick: goToBatch }
        : status === 'error'
          ? { label: 'View partial', onClick: goToBatch }
          : undefined,
  };
}

function deriveAINotification(bus: any): any | null {
  const status: string = bus?.status;
  if (!status || status === 'idle' || status === 'success') return null;
  if (status === 'loading-step-1' || status === 'loading-step-2') {
    return {
      id: `ai-${bus.scenario}`,
      kind: 'ai-investigator',
      status: 'running',
      title: 'AI investigation',
      meta:
        status === 'loading-step-1'
          ? 'Retrieving listings'
          : 'Cross-checking signals',
      progress: { kind: 'step', step: status === 'loading-step-1' ? 1 : 2, of: 2 },
      startedAt: Date.now(),
    };
  }
  if (status === 'error') {
    return {
      id: `ai-${bus.scenario}`,
      kind: 'ai-investigator',
      status: 'error',
      title: 'AI investigation',
      meta: bus.errorMessage || 'Network error',
      startedAt: Date.now(),
      finishedAt: Date.now(),
      primaryAction: {
        label: 'Retry',
        onClick: () => {
          if (bus.scenario) (startAIInvestigation as any)(bus.scenario);
        },
      },
    };
  }
  return null;
}

interface NotificationDockProps {
  notifications?: any[];
  forcedExpanded?: boolean;
  forceHover?: boolean;
  forceFocused?: boolean;
  /** When true the dock is anchored to the nearest positioned ancestor
   *  (used by the states-spec frames). Defaults to fixed-to-viewport. */
  contained?: boolean;
}

function NotificationDock(props: NotificationDockProps) {
  // Spec gallery renders without an AppStateProvider — so it can't call
  // the live hooks. Branch at the entry point.
  if (props.notifications !== undefined) {
    return <DockShell {...props} />;
  }
  return <LiveDock contained={props.contained} />;
}

// Production wrapper — subscribes to live state.
function LiveDock({ contained }: { contained?: boolean }) {
  const appState: any = (useAppState as any)();
  const aiBus: any = (useAIInvestigator as any)();
  const liveBatch = appState?.liveBatch ?? null;

  // HashRouter-aware navigate — falls back to mutating location.hash so
  // the dock works even if rendered outside a Router boundary (e.g.
  // states-spec frames would never hit this path, but safe regardless).
  let routerHistory: any = null;
  let routerLocation: any = null;
  try {
    routerHistory = (ReactRouterDOM as any)?.useHistory?.();
    routerLocation = (ReactRouterDOM as any)?.useLocation?.();
  } catch {
    routerHistory = null;
    routerLocation = null;
  }
  const pathname: string = routerLocation?.pathname || '';

  // Suppress notifications for tasks whose page is already showing a
  // rich inline progress surface. The dock is for cross-page awareness —
  // when the user navigates back into the originating page, the inline
  // signal owns it.
  const suppressBatch = pathname === '/batch';
  const suppressAI = pathname.startsWith('/result/');

  const navigate = (href: string) => {
    if (routerHistory?.push) routerHistory.push(href);
    else window.location.hash = `#${href}`;
  };

  const dismissBatch = appState?.dismissBatch as (() => void) | undefined;

  const derived: any[] = (React as any).useMemo(() => {
    const list: any[] = [];
    if (!suppressBatch) {
      const b = deriveBatchNotification(liveBatch, navigate, dismissBatch);
      if (b) list.push(b);
    }
    if (!suppressAI) {
      const a = deriveAINotification(aiBus);
      if (a) list.push(a);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveBatch, aiBus, suppressBatch, suppressAI]);

  const dismiss = (id: string) => {
    if (liveBatch && liveBatch.id === id && dismissBatch) dismissBatch();
  };

  if (derived.length === 0) return null;
  return (
    <DockShell
      notifications={derived}
      onDismiss={dismiss}
      contained={contained}
    />
  );
}

// Pure presenter — used by both LiveDock and the spec gallery.
function DockShell({
  notifications,
  forcedExpanded,
  forceHover,
  forceFocused,
  contained,
  onDismiss,
}: NotificationDockProps & { onDismiss?: (id: string) => void }) {
  const list = notifications || [];
  const [internalExpanded, setInternalExpanded] = (React as any).useState(false);
  const expanded = forcedExpanded !== undefined ? forcedExpanded : internalExpanded;

  (React as any).useEffect(() => {
    if (!expanded || forcedExpanded !== undefined) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInternalExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, forcedExpanded]);

  if (list.length === 0) return null;

  return (
    <div
      className={(contained ? 'absolute' : 'fixed') + ' notification-dock'}
      style={{
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        animation: 'dock-in 320ms var(--ease-spring) both',
      }}
    >
      {expanded ? (
        <NotificationStack
          notifications={list}
          onCollapse={() => setInternalExpanded(false)}
          onDismiss={onDismiss}
        />
      ) : (
        <NotificationPill
          notifications={list}
          onExpand={() => setInternalExpanded(true)}
          forceHover={forceHover}
          forceFocused={forceFocused}
        />
      )}
    </div>
  );
}
