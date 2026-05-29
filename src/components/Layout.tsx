import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

const navItems = [
  { to: '/', label: 'Home', icon: '◉' },
  { to: '/entry', label: 'Entry', icon: '✎' },
  { to: '/history', label: 'History', icon: '☰' },
  { to: '/analytics', label: 'Stats', icon: '◧' },
  { to: '/settings', label: 'More', icon: '⚙' },
];

export function Layout() {
  const { resolved, toggle } = useTheme();

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header
        className="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 px-5 pb-3 backdrop-blur-xl"
        style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Office Time Tracker
            </p>
            <h1 className="text-lg font-bold text-text-primary">Executive Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-elevated text-lg transition active:scale-95"
            aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolved === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main
        className="flex-1 px-4 py-5"
        style={{ paddingBottom: 'calc(5.5rem + var(--safe-bottom))' }}
      >
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 backdrop-blur-xl"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
