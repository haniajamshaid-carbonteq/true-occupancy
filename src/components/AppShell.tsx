/* global React */
// Two-column app shell: 248px sidebar + flexible main column.
// Pure layout — caller passes <Sidebar /> and the page body as children.

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans grid grid-cols-[248px_1fr]">
      {sidebar}
      <main className="px-12 pt-8 pb-20">{children}</main>
    </div>
  );
}
