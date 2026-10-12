import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config.js';


// Local storage keys for fallback demo mode
const LOCAL_USERS_KEY = 'dsa_planner_users';
const LOCAL_SESSION_KEY = 'dsa_planner_session';

function getLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save local users', e);
  }
}

function getLocalSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalSession(user) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to set local session', e);
  }
}

/**
 * Register a new user
 */
export async function registerUser(name, email, password) {
  if (isFirebaseConfigured && auth && db) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Save user record in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        createdAt: new Date().toISOString()
      });

      return {
        uid: user.uid,
        name: user.displayName || name,
        email: user.email
      };
    } catch (error) {
      throw formatAuthError(error);
    }
  }

  // Fallback mode
  const users = getLocalUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    const err = new Error('An account with this email address already exists.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  const newUser = {
    uid: 'user_' + Math.random().toString(36).substring(2, 9),
    name,
    email,
    password, // stored locally for fallback testing
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveLocalUsers(users);

  const sessionUser = {
    uid: newUser.uid,
    name: newUser.name,
    email: newUser.email
  };
  setLocalSession(sessionUser);

  // Trigger custom auth event for listeners
  window.dispatchEvent(new CustomEvent('auth-state-change', { detail: sessionUser }));
  return sessionUser;
}

/**
 * Log in an existing user
 */
export async function loginUser(email, password) {
  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      return {
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email
      };
    } catch (error) {
      throw formatAuthError(error);
    }
  }

  // Fallback mode
  const users = getLocalUsers();
  const found = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!found) {
    const err = new Error('Invalid email or password.');
    err.code = 'auth/invalid-credential';
    throw err;
  }

  const sessionUser = {
    uid: found.uid,
    name: found.name,
    email: found.email
  };
  setLocalSession(sessionUser);
  window.dispatchEvent(new CustomEvent('auth-state-change', { detail: sessionUser }));
  return sessionUser;
}

/**
 * Log out current user
 */
export async function logoutUser() {
  try {
    if (isFirebaseConfigured && auth && typeof auth.signOut === 'function') {
      await signOut(auth);
    } else if (auth && typeof auth.signOut === 'function') {
      await auth.signOut();
    }
  } catch (err) {
    console.warn('[Auth] SignOut warning:', err);
  }

  setLocalSession(null);
  try {
    localStorage.removeItem('dsa_planner_token');
    localStorage.removeItem('dsa_planner_session');
  } catch {}

  // Dispatch custom events to inform all React components to clear their project/task/stats state immediately
  window.dispatchEvent(new CustomEvent('dsa-auth-logout'));
  window.dispatchEvent(new CustomEvent('auth-state-change', { detail: null }));
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (isFirebaseConfigured && auth) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      throw formatAuthError(error);
    }
  }

  // Fallback mode
  const users = getLocalUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!found) {
    const err = new Error('No account found with this email address.');
    err.code = 'auth/user-not-found';
    throw err;
  }
  return true;
}

/**
 * Listen to authentication state changes
 */
export function subscribeToAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async user => {
      if (user) {
        let displayName = user.displayName;
        if (!displayName && db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              displayName = userDoc.data().name;
            }
          } catch (e) {
            console.error('Error fetching user profile doc', e);
          }
        }
        callback({
          uid: user.uid,
          name: displayName || user.email?.split('@')[0] || 'User',
          email: user.email
        });
      } else {
        callback(null);
      }
    });
  }

  // Fallback listener
  const getEffectiveSession = (rawUser) => {
    const user = rawUser || getLocalSession();
    if (!user) return null;
    const token = localStorage.getItem('dsa_planner_token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const tokenUid = payload?.id || payload?.uid;
          if (tokenUid) {
            return {
              ...user,
              uid: tokenUid,
              id: tokenUid,
              name: payload.name || user.name,
              email: payload.email || user.email
            };
          }
        }
      } catch {}
    }
    return user;
  };

  callback(getEffectiveSession());

  const handler = (e) => {
    callback(e.detail ? getEffectiveSession(e.detail) : null);
  };
  window.addEventListener('auth-state-change', handler);

  return () => {
    window.removeEventListener('auth-state-change', handler);
  };
}

/**
 * Friendly error messaging
 */
function formatAuthError(error) {
  let message = 'Something went wrong. Please try again.';

  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'An account with this email already exists.';
      break;
    case 'auth/invalid-email':
      message = 'Please provide a valid email address.';
      break;
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      message = 'Invalid email or password.';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your internet connection.';
      break;
    default:
      if (error.message) message = error.message;
  }

  const err = new Error(message);
  err.code = error.code;
  return err;
}
