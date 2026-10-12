import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Network,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Play,
  Zap,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  RotateCcw,
  Code
} from 'lucide-react';
import Button from '../components/Button';
import { generateSchedule } from '../algorithms/scheduler.js';
import { formatDuration } from '../utils/helpers.js';

export default function Landing() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const pendingActionRef = useRef(null); // 'login' | 'getStarted' | null
  const [isPending, setIsPending] = useState(false);

  // Handle pending clicks once Firebase Auth completes loading
  useEffect(() => {
    if (!loading && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setIsPending(false);
      if (action === 'login') {
        navigate(currentUser ? '/dashboard' : '/login');
      } else if (action === 'getStarted') {
        navigate(currentUser ? '/dashboard' : '/signup');
      }
    }
  }, [loading, currentUser, navigate]);

  const handleLoginClick = (e) => {
    if (e) e.preventDefault();
    if (loading) {
      pendingActionRef.current = 'login';
      setIsPending(true);
      return;
    }
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleGetStartedClick = (e) => {
    if (e) e.preventDefault();
    if (loading) {
      pendingActionRef.current = 'getStarted';
      setIsPending(true);
      return;
    }
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };
  // Live DSA Engine Interactive Playground State
  const [demoScenario, setDemoScenario] = useState('valid'); // 'valid' or 'cycle'
  const [isRunning, setIsRunning] = useState(false);
  const [demoResult, setDemoResult] = useState(() => {
    // Initial calculation on load
    const initialTasks = [
      { id: '1', name: 'Requirement Analysis', duration: 3, status: 'Completed' },
      { id: '2', name: 'Design', duration: 4, status: 'In Progress' },
      { id: '3', name: 'Coding', duration: 6, status: 'Pending' },
      { id: '4', name: 'Testing', duration: 3, status: 'Pending' },
      { id: '5', name: 'Deployment', duration: 2, status: 'Pending' }
    ];
    const initialDeps = [
      { predecessorId: '1', successorId: '2' },
      { predecessorId: '2', successorId: '3' },
      { predecessorId: '3', successorId: '4' },
      { predecessorId: '4', successorId: '5' }
    ];
    return generateSchedule(initialTasks, initialDeps);
  });

  // Top-Right Navbar Scroll Effects & Scroll-Spy State
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      // Scroll progress percentage across the full document
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - winHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;
      setScrollProgress(progress);

      // Dynamic Section Scroll Spy
      const sections = ['features', 'how-it-works', 'dsa'];
      let current = '';

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Active when section header or upper part passes detection threshold
          if (rect.top <= 240 && rect.bottom >= 120) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      const navOffset = 72;
      const y = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const handleRunDemo = (scenarioType = demoScenario) => {
    setIsRunning(true);
    setTimeout(() => {
      if (scenarioType === 'valid') {
        const tasks = [
          { id: '1', name: 'Requirement Analysis', duration: 3, status: 'Completed' },
          { id: '2', name: 'Design', duration: 4, status: 'In Progress' },
          { id: '3', name: 'Coding', duration: 6, status: 'Pending' },
          { id: '4', name: 'Testing', duration: 3, status: 'Pending' },
          { id: '5', name: 'Deployment', duration: 2, status: 'Pending' }
        ];
        const deps = [
          { predecessorId: '1', successorId: '2' },
          { predecessorId: '2', successorId: '3' },
          { predecessorId: '3', successorId: '4' },
          { predecessorId: '4', successorId: '5' }
        ];
        setDemoResult(generateSchedule(tasks, deps));
      } else {
        // Circular loop scenario: A -> B -> C -> A
        const tasks = [
          { id: 'A', name: 'Task A (Architecture)', duration: 3 },
          { id: 'B', name: 'Task B (API Backend)', duration: 4 },
          { id: 'C', name: 'Task C (Database Schema)', duration: 5 }
        ];
        const deps = [
          { predecessorId: 'A', successorId: 'B' },
          { predecessorId: 'B', successorId: 'C' },
          { predecessorId: 'C', successorId: 'A' } // cycle
        ];
        setDemoResult(generateSchedule(tasks, deps));
      }
      setIsRunning(false);
    }, 400);
  };

  const handleSelectScenario = (type) => {
    setDemoScenario(type);
    handleRunDemo(type);
  };

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar with Scroll Reaction & Dynamic Link Effects (Color Hunt Palette: #000000, #1F150C, #412D15, #E1DCC9) */}
      <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
        {/* Dynamic Scroll Progress Bar */}
        <div className="scroll-progress-line" style={{ width: `${scrollProgress}%` }} />

        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isScrolled ? '0.75rem 1.5rem' : '1.1rem 1.5rem',
            transition: 'padding 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Logo / Brand with Sora Font */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setActiveSection('');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #000000, #412d15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(65, 45, 21, 0.45)',
                border: '1px solid rgba(225, 220, 201, 0.2)'
              }}
            >
              <Network size={20} color="var(--ch-sand)" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              AutoSchedule<span style={{ color: 'var(--ch-sand)' }}>DSA</span>
            </span>
          </a>

          {/* Top Right Navigation: Features, How It Works, DSA Engine with Interactive Effects */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="nav-links-dock">
              {/* Features Link with Scroll Effects */}
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, 'features')}
                className={`nav-link-pill ${activeSection === 'features' ? 'active-features' : ''}`}
                title="Explore Core Algorithms & Graph Features"
              >
                <Sparkles size={15} style={{ color: activeSection === 'features' ? '#ffffff' : '#d8d1bc' }} />
                <span>Features</span>
                {activeSection === 'features' && <span className="nav-pulse-dot bronze" />}
              </a>

              {/* How It Works Link with Scroll Effects */}
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className={`nav-link-pill ${activeSection === 'how-it-works' ? 'active-how-it-works' : ''}`}
                title="See 4-Step Project Scheduling Pipeline"
              >
                <GitBranch size={15} style={{ color: activeSection === 'how-it-works' ? '#ffffff' : '#d8d1bc' }} />
                <span>How It Works</span>
                {activeSection === 'how-it-works' && <span className="nav-pulse-dot sand" />}
              </a>

              {/* DSA Engine Link with Live Pulse Effects */}
              <a
                href="#dsa"
                onClick={(e) => scrollToSection(e, 'dsa')}
                className={`nav-link-pill ${activeSection === 'dsa' ? 'active-dsa' : ''}`}
                title="Interactive DSA Algorithm Playground"
              >
                <Cpu size={15} style={{ color: activeSection === 'dsa' ? '#ffffff' : '#f0e6d6' }} />
                <span>DSA Engine</span>
                <span className="dsa-badge">LIVE</span>
                {activeSection === 'dsa' && <span className="nav-pulse-dot amber" />}
              </a>
            </div>

            <div style={{ height: '24px', width: '1px', background: 'rgba(225, 220, 201, 0.2)', margin: '0 0.25rem' }} />

            <button
              type="button"
              onClick={handleLoginClick}
              disabled={loading && isPending && pendingActionRef.current === 'login'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ch-sand)',
                fontFamily: 'var(--font-main)',
                fontSize: '0.9rem',
                fontWeight: '600',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                cursor: loading && isPending && pendingActionRef.current === 'login' ? 'wait' : 'pointer',
                opacity: loading && isPending && pendingActionRef.current === 'login' ? 0.7 : 1
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ch-sand)')}
            >
              {loading && isPending && pendingActionRef.current === 'login' ? 'Checking...' : 'Login'}
            </button>

            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              onClick={handleGetStartedClick}
              loading={loading && isPending && pendingActionRef.current === 'getStarted'}
              disabled={loading && isPending && pendingActionRef.current === 'getStarted'}
            >
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '5rem 2rem 4rem',
          textAlign: 'center',
          maxWidth: '920px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(65, 45, 21, 0.08)',
            color: 'var(--ch-bronze)',
            padding: '0.4rem 1.1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.03em',
            marginBottom: '1.5rem',
            border: '1px solid rgba(65, 45, 21, 0.25)'
          }}
        >
          <Sparkles size={16} color="var(--ch-bronze)" />
          <span>Graph Theory & CPM Planning Algorithm</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'var(--text-main)',
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem'
          }}
        >
          Plan Smarter. <br />
          <span style={{ color: 'var(--ch-bronze)' }}>Schedule Automatically.</span>
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-main)',
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '720px',
            margin: '0 auto 2.5rem'
          }}
        >
          Create project tasks, define dependencies, and automatically discover the optimal execution order and critical path.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            onClick={handleGetStartedClick}
            loading={loading && isPending && pendingActionRef.current === 'getStarted'}
            disabled={loading && isPending && pendingActionRef.current === 'getStarted'}
          >
            Get Started Free
          </Button>
          <a href="#dsa">
            <Button variant="secondary" size="lg" icon={Cpu}>
              Try DSA Engine Live
            </Button>
          </a>
        </div>

        {/* Visual Workflow Representation: Tasks -> Dependencies -> Graph Analysis -> Smart Schedule */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            maxWidth: '820px',
            margin: '0 auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(65, 45, 21, 0.09)', color: 'var(--ch-bronze)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Tasks</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vertices (V)</div>
            </div>
          </div>

          <div style={{ color: 'var(--ch-bronze)', fontWeight: 'bold' }}>→</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(31, 21, 12, 0.08)', color: 'var(--ch-espresso)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Dependencies</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Directed Edges (E)</div>
            </div>
          </div>

          <div style={{ color: 'var(--ch-bronze)', fontWeight: 'bold' }}>→</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(0, 0, 0, 0.08)', color: 'var(--ch-black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Network size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Graph Analysis</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kahn's & CPM</div>
            </div>
          </div>

          <div style={{ color: 'var(--ch-bronze)', fontWeight: 'bold' }}>→</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(46, 90, 54, 0.12)', color: 'var(--success-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Smart Schedule</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Execution Order</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section
        id="features"
        style={{
          background: 'var(--bg-page)',
          padding: '5rem 2rem',
          borderTop: '1px solid var(--border-light)',
          scrollMarginTop: '80px'
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(65, 45, 21, 0.08)',
                color: 'var(--ch-bronze)',
                padding: '0.35rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em',
                marginBottom: '0.75rem',
                border: '1px solid rgba(65, 45, 21, 0.2)'
              }}
            >
              <Sparkles size={14} />
              <span>CORE ALGORITHMS & CAPABILITIES</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.3rem', fontWeight: 800, color: 'var(--ch-espresso)', letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
              Engineered with Data Structures & Algorithms
            </h2>
            <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '620px', margin: '0 auto' }}>
              Robust graph algorithms handle complex task networks up to 1000 tasks with zero lag.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Feature 1 */}
            <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--border-light)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: 'rgba(65, 45, 21, 0.1)', color: 'var(--ch-bronze)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Layers size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Task Management
              </h3>
              <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Easily create, edit, and organize project tasks with clear durations and execution statuses.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--border-light)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: 'rgba(31, 21, 12, 0.08)', color: 'var(--ch-espresso)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <GitBranch size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Dependency Tracking
              </h3>
              <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Define predecessor and successor relationships between tasks intuitively with automatic validation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--border-light)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 0, 0, 0.08)', color: 'var(--ch-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Play size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Automatic Scheduling
              </h3>
              <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Kahn's Topological Sorting algorithm calculates the exact conflict-free execution order in O(V + E) time.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--border-light)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: 'var(--critical-red-bg)', color: 'var(--critical-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Critical Path
              </h3>
              <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Calculates the longest path of dependent tasks that determines the absolute minimum project duration.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--border-light)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: 'var(--warning-amber-bg)', color: 'var(--warning-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Circular Dependency Detection
              </h3>
              <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Instant DFS cycle detection warns you if task dependencies form impossible circular loops (A → B → C → A).
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--border-light)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: 'rgba(65, 45, 21, 0.12)', color: 'var(--ch-bronze)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Calendar size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Project Timeline
              </h3>
              <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Interactive Gantt-style timeline dynamically highlights parallel tasks, start/end days, and critical tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section
        id="how-it-works"
        style={{
          padding: '5rem 2rem',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          scrollMarginTop: '80px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(65, 45, 21, 0.08)',
              color: 'var(--ch-bronze)',
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.04em',
              marginBottom: '0.75rem',
              border: '1px solid rgba(65, 45, 21, 0.2)'
            }}
          >
            <GitBranch size={14} />
            <span>4-STEP GRAPH PIPELINE</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.3rem', fontWeight: 800, color: 'var(--ch-espresso)', letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
            How It Works
          </h2>
          <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '620px', margin: '0 auto' }}>
            Four simple steps to transform messy requirements into an optimized schedule.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--ch-black)', color: 'var(--ch-sand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 auto 1.25rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}>
              1
            </div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Create Project
            </h4>
            <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.55' }}>
              Define your project name, optional target start date, and brief scope description.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--ch-bronze)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 auto 1.25rem', boxShadow: '0 4px 12px rgba(65, 45, 21, 0.3)' }}>
              2
            </div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Add Tasks
            </h4>
            <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.55' }}>
              Add tasks with expected durations in days (e.g. Requirement Analysis: 3 days).
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--ch-espresso)', color: 'var(--ch-sand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 auto 1.25rem', boxShadow: '0 4px 12px rgba(31, 21, 12, 0.3)' }}>
              3
            </div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Connect Dependencies
            </h4>
            <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.55' }}>
              Select which task must finish before another can start. Cycle checks run automatically.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--ch-bronze), var(--ch-black))', color: 'var(--ch-sand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 auto 1.25rem', boxShadow: '0 4px 14px rgba(65, 45, 21, 0.4)' }}>
              4
            </div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Generate Schedule
            </h4>
            <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.55' }}>
              Instantly discover optimal execution order, earliest start/finish days, and the Critical Path.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive DSA Engine Section (Targeted by #dsa) */}
      <section
        id="dsa"
        style={{
          background: 'linear-gradient(180deg, var(--bg-page) 0%, #ede8d7 100%)',
          padding: '5rem 2rem',
          borderTop: '1px solid var(--border-light)',
          scrollMarginTop: '80px'
        }}
      >
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(31, 21, 12, 0.08)',
                color: 'var(--ch-espresso)',
                padding: '0.35rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em',
                marginBottom: '1rem',
                border: '1px solid rgba(31, 21, 12, 0.18)'
              }}
            >
              <Cpu size={16} color="var(--ch-bronze)" />
              <span>LIVE ALGORITHM PLAYGROUND</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.3rem', fontWeight: 800, color: 'var(--ch-espresso)', letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
              DSA Scheduling Engine Live Sandbox
            </h2>
            <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto' }}>
              Execute Kahn's Topological Sort, Circular Dependency Detection, and Critical Path calculations live right now in your browser.
            </p>
          </div>

          {/* Scenario Selector & Run Control Bar */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.75rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: '#ffffff',
              borderColor: 'var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--ch-espresso)' }}>
                Select Test Scenario:
              </span>
              <button
                type="button"
                onClick={() => handleSelectScenario('valid')}
                className={`btn btn-sm ${demoScenario === 'valid' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontWeight: 600,
                  ...(demoScenario === 'valid'
                    ? { background: 'var(--ch-bronze)', borderColor: 'var(--ch-bronze)', color: '#ffffff' }
                    : {})
                }}
              >
                1. Standard SDLC Project (Valid DAG)
              </button>
              <button
                type="button"
                onClick={() => handleSelectScenario('cycle')}
                className={`btn btn-sm ${demoScenario === 'cycle' ? 'btn-danger' : 'btn-secondary'}`}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontWeight: 600,
                  ...(demoScenario === 'cycle'
                    ? { background: 'var(--critical-red)', borderColor: 'var(--critical-red)', color: '#ffffff' }
                    : {})
                }}
              >
                2. Circular Dependency Test (Loop A→B→C→A)
              </button>
            </div>

            <Button
              variant="navy"
              size="md"
              icon={Play}
              loading={isRunning}
              onClick={() => handleRunDemo(demoScenario)}
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                background: 'var(--ch-espresso)',
                borderColor: 'var(--ch-espresso)',
                boxShadow: '0 4px 12px rgba(31, 21, 12, 0.25)'
              }}
            >
              Re-run DSA Engine
            </Button>
          </div>

          {/* Live Algorithm Output Dashboard */}
          <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-lg)', borderColor: 'var(--border-light)' }}>
            {demoScenario === 'valid' && demoResult?.success && (
              <div>
                {/* Result Top Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    background: 'var(--success-green-bg)',
                    border: '1px solid rgba(46, 90, 54, 0.3)',
                    padding: '1.1rem 1.6rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={24} color="var(--success-green)" />
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--success-green)', fontSize: '1.05rem' }}>
                        Valid DAG Detected • Schedule Generated
                      </h4>
                      <div style={{ fontFamily: 'var(--font-main)', fontSize: '0.85rem', color: '#274e30' }}>
                        Graph is acyclic. Topological sequence established with zero conflicts.
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      MINIMUM PROJECT DURATION
                    </span>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--ch-bronze)' }}>
                      {formatDuration(demoResult.projectDuration)}
                    </div>
                  </div>
                </div>

                {/* 2-column breakdown: Execution Order & Critical Path */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
                  {/* Kahn's Execution Order */}
                  <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Play size={18} color="var(--ch-bronze)" />
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ch-espresso)' }}>
                        Topological Execution Order (Kahn's BFS)
                      </h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {demoResult.executionOrder.map((task, idx) => (
                        <div
                          key={task.id}
                          style={{
                            background: '#ffffff',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--ch-espresso)', color: 'var(--ch-sand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontFamily: 'var(--font-main)', fontWeight: 600 }}>{task.name}</span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDuration(task.duration)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Critical Path Sequence */}
                  <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Zap size={18} color="var(--critical-red)" />
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ch-espresso)' }}>
                        Critical Path (Longest Path in DAG)
                      </h4>
                    </div>
                    <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Tasks with Slack = 0 (No delay tolerance):
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {demoResult.criticalPath.map((task, idx) => (
                        <div
                          key={task.id}
                          style={{
                            background: 'var(--critical-red-bg)',
                            border: '1px solid var(--critical-red-border)',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--critical-red)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontFamily: 'var(--font-main)', fontWeight: 700, color: '#991b1b' }}>{task.name}</span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#b91c1c', fontSize: '0.8rem' }}>
                            Day {task.earliestStart} → Day {task.earliestFinish}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Adjacency List Object representation */}
                <div style={{ background: 'var(--ch-black)', border: '1px solid var(--ch-bronze)', padding: '1.25rem', borderRadius: 'var(--radius-md)', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ch-sand)', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                      <Code size={16} color="var(--ch-sand)" />
                      <span>Internal Adjacency List Structure (Map / JSON)</span>
                    </div>
                    <span style={{ color: 'var(--ch-sand)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>O(V + E) Lookup</span>
                  </div>
                  <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#e1dcc9', overflowX: 'auto' }}>
                    {JSON.stringify(demoResult.adjacencyList, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Circular Dependency Result Display */}
            {demoScenario === 'cycle' && (
              <div>
                <div
                  className="alert alert-danger"
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <AlertTriangle size={28} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                        Circular Dependency Detected by 3-Color DFS!
                      </h3>
                      <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                        Scheduling cannot be generated because a circular dependency exists in the task network.
                      </p>
                      <div
                        style={{
                          background: '#ffffff',
                          padding: '0.75rem 1.25rem',
                          borderRadius: 'var(--radius-sm)',
                          color: '#991b1b',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          fontFamily: 'var(--font-mono)',
                          display: 'inline-block',
                          border: '1px solid #fca5a5'
                        }}
                      >
                        Detected Loop: Task A (Architecture) → Task B (API Backend) → Task C (Database Schema) → Task A (Architecture)
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--ch-espresso)' }}>
                    Why did Kahn's Algorithm halt?
                  </h4>
                  <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-muted)' }}>
                    Because every task in a directed cycle has an in-degree of at least 1, no vertex can ever reach in-degree 0 to enter the processing queue. Kahn's algorithm terminates with <code>processedCount &lt; totalVertices</code> (0 &lt; 3), mathematically proving a deadlock cycle exists.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Academic Complexity Table */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}
          >
            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>GRAPH STRUCTURE</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ch-espresso)', marginTop: '0.2rem' }}>Adjacency List</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ch-bronze)', marginTop: '0.2rem', fontWeight: 600 }}>Space: O(V + E)</div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>CYCLE CHECK</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ch-espresso)', marginTop: '0.2rem' }}>3-Color DFS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ch-bronze)', marginTop: '0.2rem', fontWeight: 600 }}>Time: O(V + E)</div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>SORTING ALGORITHM</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ch-espresso)', marginTop: '0.2rem' }}>Kahn's BFS Order</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ch-bronze)', marginTop: '0.2rem', fontWeight: 600 }}>Time: O(V + E)</div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>CRITICAL PATH</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ch-espresso)', marginTop: '0.2rem' }}>CPM Longest Path</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ch-bronze)', marginTop: '0.2rem', fontWeight: 600 }}>Time: O(V + E)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', background: 'var(--ch-espresso)', color: 'var(--text-sand)', padding: '2.5rem 2rem', borderTop: '1px solid var(--navy-border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            <Network size={20} color="var(--ch-sand)" />
            <span>Automated Project Task Planning and Scheduling</span>
          </div>
          <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.8rem', color: 'rgba(225, 220, 201, 0.75)' }}>
            Student DSA Project • Directed Graphs • Topological Sort • Critical Path Method (CPM)
          </p>
        </div>
      </footer>
    </div>
  );
}
