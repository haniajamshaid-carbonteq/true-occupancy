/* global React, AppStateContext */
// MockAppStateProvider — wraps real production pages with a controlled
// AppState value so the states-spec canvas can mount the same screens
// in empty / loading / error variants without a backend.
//
// Plugs directly into the same React context that AppStateProvider uses
// (AppStateContext is declared at top-level of src/state/AppState.tsx,
// so it lives in shared script scope alongside this file). Anything not
// overridden falls through to a benign no-op so consumers of action
// methods (cancelSchedule, addSchedule, etc.) don't crash in the spec.

interface MockOverrides {
  liveBatch?: any;
  schedules?: any[];
  history?: any[];
  loading?: boolean;
  error?: string | null;
}

function noop() {}

function MockAppStateProvider({
  value,
  children,
}: {
  value: MockOverrides;
  children: React.ReactNode;
}) {
  const mock = React.useMemo(() => ({
    liveBatch: value.liveBatch ?? null,
    schedules: value.schedules ?? [],
    history: value.history ?? [],
    loading: value.loading ?? false,
    error: value.error ?? null,
    startSampleBatch: noop,
    clearBatch: noop,
    dismissBatch: noop,
    retryBatchRow: noop,
    addSchedule: noop,
    updateScheduleCadence: noop,
    cancelSchedule: noop,
    findScheduleByTarget: () => null,
  }), [value]);
  return (
    <AppStateContext.Provider value={mock as any}>
      {children}
    </AppStateContext.Provider>
  );
}
