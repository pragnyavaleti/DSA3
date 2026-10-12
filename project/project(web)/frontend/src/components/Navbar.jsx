import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Network,
  LogOut,
  User,
  Settings as SettingsIcon,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ toggleMobileSidebar, isMobileSidebarOpen }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <header
      style={{
        background: 'var(--primary-navy)',
        color: '#ffffff',
        borderBottom: '1px solid var(--navy-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {currentUser && (
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="mobile-toggle-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'none',
              padding: '0.25rem'
            }}
            aria-label="Toggle menu"
          >
            {isMobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        <Link
          to={currentUser ? '/dashboard' : '/'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.15rem',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-heading)'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--ch-bronze)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ch-sand)',
              boxShadow: '0 2px 8px rgba(65, 45, 21, 0.5)'
            }}
          >
            <Network size={18} />
          </div>
          <span>AutoSchedule<span style={{ color: 'var(--ch-sand)', fontWeight: 800 }}>DSA</span></span>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {currentUser ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(225, 220, 201, 0.1)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                border: '1px solid rgba(225, 220, 201, 0.15)'
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--ch-bronze)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)'
                }}
              >
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-sand)', fontFamily: 'var(--font-main)' }}>
                {currentUser.name || currentUser.email}
              </span>
            </div>

            <Link
              to="/settings"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#d8d1bc',
                cursor: 'pointer',
                display: 'flex',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'color var(--transition-fast)'
              }}
              title="Settings"
            >
              <SettingsIcon size={18} />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                fontFamily: 'var(--font-main)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'background var(--transition-fast)'
              }}
              title="Log out"
            >
              <LogOut size={16} />
              <span className="logout-text">Logout</span>
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-secondary btn-sm" style={{ color: 'var(--ch-sand)', background: 'rgba(225, 220, 201, 0.12)', borderColor: 'rgba(225, 220, 201, 0.25)', fontFamily: 'var(--font-main)' }}>
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm" style={{ background: 'var(--ch-bronze)', borderColor: 'var(--ch-bronze)', color: '#ffffff', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
