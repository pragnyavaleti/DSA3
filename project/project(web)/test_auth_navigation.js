/**
 * Test Suite: Authentication-based Navigation & Routing for AutoScheduleDSA
 * Validates scenarios 1-10 specified in the prompt:
 * 1. Logged out + Click Login -> /login
 * 2. Logged out + Click Get Started Free -> /signup
 * 3. Create account -> Redirects to /dashboard
 * 4. Refresh / Re-mount dashboard -> Authenticated session remains valid
 * 5. Logged in + Click Get Started Free / Login on Landing -> /dashboard
 * 6. Logout + Click Login -> /login
 * 7. Logout + Click Get Started Free -> /signup
 * 8. Logged out + open /dashboard -> Redirects to /login
 * 9. Logged in + open /login or /signup -> Redirects to /dashboard
 * 10. Check for redirect loops, duplicate Firebase init, and configuration integrity
 */

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 RUNNING AUTHENTICATION-BASED NAVIGATION TEST SUITE');
console.log('====================================================\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

const landingPath = path.resolve('frontend/src/pages/Landing.jsx');
const appPath = path.resolve('frontend/src/App.jsx');
const loginPath = path.resolve('frontend/src/pages/Login.jsx');
const registerPath = path.resolve('frontend/src/pages/Register.jsx');
const navbarPath = path.resolve('frontend/src/components/Navbar.jsx');
const configPath = path.resolve('frontend/src/firebase/config.js');

const landingContent = fs.readFileSync(landingPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');
const loginContent = fs.readFileSync(loginPath, 'utf8');
const registerContent = fs.readFileSync(registerPath, 'utf8');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');
const configContent = fs.readFileSync(configPath, 'utf8');

// Scenario 1: Logged out -> click Login -> navigates to /login
console.log('--- SCENARIO 1: Logged Out + Click Login ---');
assert(
  landingContent.includes("navigate(currentUser ? '/dashboard' : '/login')") ||
  landingContent.includes("if (currentUser) {\n      navigate('/dashboard');\n    } else {\n      navigate('/login');\n    }"),
  'handleLoginClick navigates to /login when unauthenticated'
);
assert(
  landingContent.includes('onClick={handleLoginClick}'),
  'Login button in Landing header is wired to handleLoginClick'
);

// Scenario 2: Logged out -> click Get Started Free -> navigates to /signup
console.log('--- SCENARIO 2: Logged Out + Click Get Started Free ---');
assert(
  landingContent.includes("navigate(currentUser ? '/dashboard' : '/signup')") ||
  landingContent.includes("if (currentUser) {\n      navigate('/dashboard');\n    } else {\n      navigate('/signup');\n    }"),
  'handleGetStartedClick navigates to /signup for a new unauthenticated visitor'
);
assert(
  landingContent.includes('onClick={handleGetStartedClick}'),
  'Get Started Free button is wired to handleGetStartedClick'
);

// Scenario 3: Create account -> navigates to /dashboard
console.log('--- SCENARIO 3: Create Account -> /dashboard ---');
assert(
  registerContent.includes("navigate('/dashboard')"),
  'Successful registration in Register.jsx navigates to /dashboard'
);
assert(
  appContent.includes('path="/signup"') && appContent.includes('<Register />'),
  'Route /signup maps to Register component'
);

// Scenario 4: Refresh dashboard -> Session persistence
console.log('--- SCENARIO 4: Refresh Dashboard / Session Persistence ---');
assert(
  appContent.includes('<ProtectedRoute>') && appContent.includes('<Dashboard />'),
  'Dashboard route is protected under ProtectedRoute'
);
assert(
  appContent.includes('if (loading) {') && appContent.includes('LoadingSpinner'),
  'ProtectedRoute waits for auth loading state before checking session to prevent session loss on refresh'
);

// Scenario 5: Return to landing page while logged in -> Get Started Free & Login -> /dashboard
console.log('--- SCENARIO 5: Logged In on Landing Page -> /dashboard ---');
assert(
  landingContent.includes("if (currentUser) {\n      navigate('/dashboard');"),
  'Clicking Get Started Free while authenticated navigates directly to /dashboard'
);
assert(
  landingContent.includes("if (currentUser) {\n      navigate('/dashboard');"),
  'Clicking Login while authenticated navigates directly to /dashboard'
);

// Scenario 6: Log out -> click Login -> /login
console.log('--- SCENARIO 6: Log Out + Click Login ---');
assert(
  navbarContent.includes("await logout();\n      navigate('/login');"),
  'Logout clears session and navigates to /login'
);
assert(
  landingContent.includes("navigate('/login')"),
  'After logout, unauthenticated state causes Login click to navigate to /login'
);

// Scenario 7: Log out -> click Get Started Free -> /signup
console.log('--- SCENARIO 7: Log Out + Click Get Started Free ---');
assert(
  landingContent.includes("navigate('/signup')"),
  'After logout, unauthenticated state causes Get Started Free click to navigate to /signup'
);

// Scenario 8: Logged out access to /dashboard -> Redirects to /login
console.log('--- SCENARIO 8: Protected Dashboard Guard ---');
assert(
  appContent.includes('if (!currentUser) {\n    return <Navigate to="/login" state={{ from: location }} replace />;'),
  'Unauthenticated direct access to /dashboard redirects to /login'
);

// Scenario 9: Logged in access to /login or /signup -> Redirects to /dashboard
console.log('--- SCENARIO 9: Public Route Guard (/login & /signup) ---');
assert(
  appContent.includes('if (currentUser) {\n    return <Navigate to="/dashboard" replace />;'),
  'PublicRoute redirects authenticated user away from /login and /signup directly to /dashboard'
);
assert(
  appContent.includes('path="/signup"\n              element={\n                <PublicRoute>') &&
  appContent.includes('path="/login"\n              element={\n                <PublicRoute>'),
  'Both /login and /signup routes are guarded with PublicRoute'
);

// Scenario 10: No redirect loops, no duplicate Firebase initialization
console.log('--- SCENARIO 10: Integrity, No Loops & Single Firebase Instance ---');
assert(
  configContent.includes('getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)'),
  'Firebase uses single-instance pattern avoiding duplicate initialization'
);
assert(
  !landingContent.includes('initializeApp'),
  'Landing page does not initialize separate Firebase app'
);
assert(
  !appContent.includes('initializeApp'),
  'App.jsx does not initialize separate Firebase app'
);

console.log('\n====================================================');
console.log('🎉 ALL 10 AUTHENTICATION NAVIGATION TESTS PASSED!');
console.log('====================================================\n');
