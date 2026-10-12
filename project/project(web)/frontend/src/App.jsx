import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

// Navigation & Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import ProjectOverview from './pages/ProjectOverview';
import Tasks from './pages/Tasks';
import Dependencies from './pages/Dependencies';
import Schedule from './pages/Schedule';
import CriticalPath from './pages/CriticalPath';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';
import LoadingSpinner from './components/LoadingSpinner';

/**
 * Route protector for authenticated views
 */
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Verifying authentication..." fullPage />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Public route redirector (e.g. login/register redirect to dashboard if logged in)
 */
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Checking session..." fullPage />;
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Authenticated Layout Shell (Navbar + Sidebar + Main)
 */
function AppLayout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar
        toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
      <div className="app-layout" style={{ flex: 1, display: 'flex' }}>
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="main-content" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Landing />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Authenticated Application Pages with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreateProject />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectOverview />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/tasks"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Tasks />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/dependencies"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dependencies />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/schedule"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Schedule />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/critical-path"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CriticalPath />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/timeline"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Timeline />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/*"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
