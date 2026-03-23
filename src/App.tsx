import { NavLink, Route, Routes } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/practice', label: 'Practice' },
  { to: '/history', label: 'History' },
  { to: '/goals', label: 'Goals' },
  { to: '/settings', label: 'Settings' },
];

function Page({ title, description }: { title: string; description: string }) {
  return (
    <section className="page-card">
      <p className="eyebrow">Starter Screen</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brand-mark">ॐ</div>
          <div>
            <div className="brand-title">Meditation App</div>
            <div className="brand-subtitle">Practice with clarity</div>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Responsive Starter</p>
            <h1 className="topbar-title">Calm, multi-device UX foundation</h1>
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<Page title="Home" description="Quick start, favorites, recents, and sankalpa snapshot belong here." />} />
            <Route path="/practice" element={<Page title="Practice" description="Timer, custom plays, playlists, meditation types, and favorites belong here." />} />
            <Route path="/history" element={<Page title="History" description="Session logs, manual logs, and summaries belong here." />} />
            <Route path="/goals" element={<Page title="Goals" description="Active, completed, and expired sankalpas belong here." />} />
            <Route path="/settings" element={<Page title="Settings" description="Preferences, default sounds, default durations, and profile behavior belong here." />} />
          </Routes>
        </main>

        <nav className="bottom-nav" aria-label="Bottom Navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
