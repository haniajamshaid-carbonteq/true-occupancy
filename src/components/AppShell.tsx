/* global React, TopNav */
// App shell: sticky TopNav + a content column beneath it.
// Older callers may still pass a `sidebar` prop — it's accepted but ignored
// so we don't have to thread changes through every page in lockstep.

interface AppShellProps {
  children: React.ReactNode;
  /** Constrain main content width. Pages that want full-bleed can pass false. */
  contained?: boolean;
  /** Deprecated — TopNav replaces the sidebar. Accepted for backward compat. */
  sidebar?: React.ReactNode;
}

function AppShell({ children, contained = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      <TopNav />
      <main
        className={
          contained ? 'max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-16 sm:pb-20' : 'pt-6 sm:pt-8'
        }
      >
        {children}
      </main>
    </div>
  );
}
