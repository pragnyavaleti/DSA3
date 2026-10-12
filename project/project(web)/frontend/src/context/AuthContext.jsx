import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToAuth,
  loginUser,
  registerUser,
  logoutUser,
  resetPassword as sendPasswordReset
} from '../firebase/auth.js';
import { auth, isFirebaseConfigured } from '../firebase/config.js';
import { loginApi, registerApi, logoutApi, getCurrentUserApi } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Project & Task state shared across components
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);

  // Clear all project & user-specific state
  const clearProjectData = () => {
    setProjects([]);
    setSelectedProject(null);
    setTasks([]);
    setDependencies([]);
    window.dispatchEvent(new CustomEvent('dsa-auth-logout'));
  };

  // Auth State Listener: Resolves ONLY after Firebase Auth / session resolves
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToAuth(async (user) => {
      if (!isMounted) return;

      if (!user) {
        clearProjectData();
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Format authenticated user with strict uid
      let effectiveUid = user.uid || user.id;
      const token = localStorage.getItem('dsa_planner_token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload?.id) effectiveUid = payload.id;
          }
        } catch {}
      }

      const normalizedUser = {
        uid: effectiveUid,
        id: effectiveUid,
        name: user.name || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email
      };

      setCurrentUser(normalizedUser);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    // 1. Wipe previous session data before authenticating
    clearProjectData();

    // 2. Perform authentication via Firebase (with automatic fallback)
    const user = await loginUser(email, password);

    // 3. Keep backend token in sync if backend is active
    let apiUser = null;
    try {
      apiUser = await loginApi(email, password);
    } catch (e) {
      // Backend optional / offline mode
    }

    const effectiveUid = apiUser?.id || apiUser?.uid || user.uid;
    const normalizedUser = {
      uid: effectiveUid,
      id: effectiveUid,
      name: apiUser?.name || user.name || user.displayName || user.email?.split('@')[0] || 'User',
      email: apiUser?.email || user.email
    };

    try {
      localStorage.setItem('dsa_planner_session', JSON.stringify(normalizedUser));
    } catch {}

    setCurrentUser(normalizedUser);
    return normalizedUser;
  };

  const register = async (name, email, password) => {
    // 1. Wipe old state
    clearProjectData();

    // 2. Register with Firebase (with automatic fallback)
    const user = await registerUser(name, email, password);

    // 3. Keep backend token in sync if backend is active
    let apiUser = null;
    try {
      apiUser = await registerApi(name, email, password);
    } catch (e) {
      // Backend optional / offline mode
    }

    const effectiveUid = apiUser?.id || apiUser?.uid || user.uid;
    const normalizedUser = {
      uid: effectiveUid,
      id: effectiveUid,
      name: apiUser?.name || user.name || name,
      email: apiUser?.email || user.email
    };

    try {
      localStorage.setItem('dsa_planner_session', JSON.stringify(normalizedUser));
    } catch {}

    // A newly registered user starts with 0 projects
    setProjects([]);
    setSelectedProject(null);
    setTasks([]);
    setDependencies([]);

    setCurrentUser(normalizedUser);
    return normalizedUser;
  };

  const logout = async () => {
    // 1. Clear project, task, dependency, selected project state
    clearProjectData();

    // 2. Sign out of Firebase and clear local storage sessions
    await logoutUser();

    // 3. Invalidate backend API token
    try {
      await logoutApi();
    } catch {}

    // 4. Reset currentUser
    setCurrentUser(null);
  };

  const resetPassword = async (email) => {
    return await sendPasswordReset(email);
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword,
    isFirebaseConfigured,
    // Shared project state & setters
    projects,
    setProjects,
    selectedProject,
    setSelectedProject,
    tasks,
    setTasks,
    dependencies,
    setDependencies,
    clearProjectData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
