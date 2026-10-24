import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const navLinks = [
  { label: 'Home',        path: '/',       active: true  },
  { label: 'Create Poll', path: '/create', dropdown: false },
];

function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  /* close on route change */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* lock scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  /* Escape key */
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <>
      {/* ── Desktop / base navbar ── */}
      <nav className="navbar">
        <div className="navbar-inner">

          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-icon">⚡</span>
            <span>LivePoll</span>
          </Link>

          {/* Center pill — hidden on mobile */}
          <div className="navbar-pill liquid-glass">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  className={`navbar-pill-link${isActive ? ' active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                  {item.dropdown && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      strokeLinejoin="round" className="navbar-chevron" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right CTAs — hidden on mobile */}
          <div className="navbar-ctas">
            <Link to="/" className="navbar-cta-ghost liquid-glass">
              Browse
            </Link>
            <Link to="/create" className="navbar-cta-solid">
              + Create Poll
            </Link>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className={`navbar-hamburger liquid-glass${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>

        </div>
      </nav>

      {/* ── Mobile menu overlay ── */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} />
        <div className="mobile-menu-panel">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`mobile-menu-link${isActive ? ' active' : ''}`}
                onClick={() => { setMenuOpen(false); navigate(item.path); }}
              >
                <span>{item.label}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}

          <div className="mobile-menu-ctas">
            <Link to="/" className="mobile-cta-ghost" onClick={() => setMenuOpen(false)}>
              Browse
            </Link>
            <Link to="/create" className="mobile-cta-solid" onClick={() => setMenuOpen(false)}>
              + Create Poll
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
