import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Settings,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadSampleProject } from '../firebase/firestore';

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loadingSample, setLoadingSample] = React.useState(false);

  const handleLoadSample = async () => {
    if (!currentUser) return;
    setLoadingSample(true);
    try {
      const proj = await loadSampleProject(currentUser.uid);
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      if (onClose) onClose();
      navigate(`/projects/${proj.id}`);
    } catch (err) {
      console.error('Error loading sample project', err);
      alert('Could not load sample project: ' + err.message);
    } finally {
      setLoadingSample(false);
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects/new', label: 'Create Project', icon: PlusCircle },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 40
          }}
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          background: 'var(--surface-navy)',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--navy-border)',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--navy-border)' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ch-sand)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            DSA Project Planning
          </p>
          <p style={{ fontSize: '0.85rem', color: '#ffffff', marginTop: '0.25rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            Graph & Critical Path Engine
          </p>
        </div>

        <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-main)',
                  color: isActive ? '#ffffff' : '#d8d1bc',
                  background: isActive ? 'var(--accent-blue)' : 'transparent',
                  transition: 'all var(--transition-fast)'
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div style={{ margin: '1.5rem 0 0.5rem', padding: '0 0.875rem' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(225, 220, 201, 0.6)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              Academic Demo
            </span>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            disabled={loadingSample}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              fontWeight: 600,
              fontFamily: 'var(--font-main)',
              background: 'rgba(225, 220, 201, 0.08)',
              border: '1px dashed rgba(225, 220, 201, 0.3)',
              color: 'var(--ch-sand)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background var(--transition-fast)'
            }}
          >
            <Sparkles size={16} />
            <span>{loadingSample ? 'Loading Demo...' : 'Load Sample Project'}</span>
          </button>
        </nav>

        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--navy-border)', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ch-sand)', fontSize: '0.75rem', fontFamily: 'var(--font-main)' }}>
            <BookOpen size={16} />
            <span>Topological + CPM DAG</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'rgba(225, 220, 201, 0.6)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            O(V + E) Scalable Execution
          </p>
        </div>
      </aside>
    </>
  );
}
