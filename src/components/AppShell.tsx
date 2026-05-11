/* global React, SideNav */
// App shell: persistent left SideNav (sticky on md+, drawer on mobile) +
// a content column to its right. The legacy `sidebar` prop is accepted
// but ignored so callers don't have to migrate in lockstep.

interface AppShellProps {
  children: React.ReactNode;
  /** Constrain main content width. Pages that want full-bleed can pass false. */
  contained?: boolean;
  /** Deprecated — SideNav owns this. Accepted for backward compat. */
  sidebar?: React.ReactNode;
}

function AppShell({ children, contained = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      <SideNav />
      <div className="md:pl-[280px]">
        <main
          className={
            contained
              ? 'max-w-[1180px] mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-16 sm:pb-20'
              : 'pt-6 sm:pt-8'
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
