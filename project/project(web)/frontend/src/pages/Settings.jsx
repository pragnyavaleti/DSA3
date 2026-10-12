import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Sliders,
  LogOut,
  Database,
  CheckCircle2,
  HardDrive,
  Server,
  Cpu
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { useToast } from '../components/Toast';

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [backendHealth, setBackendHealth] = useState({ connected: false, checking: true });

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setBackendHealth({ connected: data.status === 'ok', checking: false, data });
      })
      .catch(() => {
        setBackendHealth({ connected: false, checking: false });
      });
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully');
      navigate('/login');
    } catch (err) {
      addToast('Logout error: ' + err.message, 'error');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
          Settings & Architecture
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Manage your account profile, architecture configuration, and database connectivity.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile Card */}
        <Card title="User Profile" subtitle="Your personal information and credentials">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <Input
              id="settings-name"
              label="Full Name"
              value={currentUser?.name || ''}
              disabled
              helpText="User profile name"
            />
            <Input
              id="settings-email"
              label="Email Address"
              value={currentUser?.email || ''}
              disabled
              helpText="Authentication email"
            />
          </div>
        </Card>

        {/* Backend & SQLite Database Status Card */}
        <Card title="Backend & Architecture Tier" subtitle="Decoupled Node.js Express server with SQLite storage">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: backendHealth.connected ? '#ecfdf5' : '#fef2f2',
                    color: backendHealth.connected ? '#059669' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Server size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    Node.js + Express REST API Server
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Running on port 5000 • Proxied via Vite dev server
                  </div>
                </div>
              </div>

              <span className={`badge ${backendHealth.connected ? 'badge-completed' : 'badge-in-progress'}`}>
                <CheckCircle2 size={12} />
                {backendHealth.connected ? 'Backend Online (Port 5000)' : 'Backend Disconnected'}
              </span>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <HardDrive size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    SQLite Database Engine
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Zero-config file-based storage: <code>backend/data/dsa_planner.sqlite</code>
                  </div>
                </div>
              </div>

              <span className="badge badge-completed">
                <CheckCircle2 size={12} />
                WAL Mode & Foreign Keys Active
              </span>
            </div>
          </div>
        </Card>

        {/* Project Preferences Card */}
        <Card title="Algorithm & Scheduling Engine" subtitle="DSA calculations executed both on server and client">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Time Unit</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Default duration metric for scheduling calculations</div>
              </div>
              <span className="badge badge-pending">Days (Integer / Decimal)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Algorithm Engine</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kahn's Topological Sort (BFS) + Critical Path Method (CPM DAG)</div>
              </div>
              <span className="badge badge-in-progress">O(V + E) Enabled</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Cycle Detection</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>3-Color Depth-First Search with circular path identification</div>
              </div>
              <span className="badge badge-completed">Active on Backend API</span>
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card title="Account Actions" subtitle="Session and security options">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Sign Out</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>End your current active session securely</div>
            </div>

            <Button
              variant="danger"
              icon={LogOut}
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
