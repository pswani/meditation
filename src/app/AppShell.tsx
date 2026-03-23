import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getActiveNavItem, primaryNavItems } from './routes';

export default function AppShell() {
  const location = useLocation();
  const activeNavItem = getActiveNavItem(location.pathname);

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-title">Meditation App</div>
            <div className="brand-subtitle">Calm daily practice</div>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main destinations">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <p className="eyebrow">{activeNavItem.eyebrow}</p>
          <h1 className="topbar-title">{activeNavItem.title}</h1>
        </header>

        <main className="content">
          <Outlet />
        </main>

        <nav className="bottom-nav" aria-label="Bottom navigation">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
