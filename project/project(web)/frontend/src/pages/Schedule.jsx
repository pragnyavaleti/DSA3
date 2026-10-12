import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, getTasks, getDependencies } from '../firebase/firestore';
import { generateSchedule } from '../algorithms/scheduler';
import { formatDuration } from '../utils/helpers';
import confetti from 'canvas-confetti';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Zap,
  Calendar,
  Network,
  Cpu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ProjectStepsNav from '../components/ProjectStepsNav';
import Button from '../components/Button';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import DsaExplainer from '../components/DsaExplainer';
import { useToast } from '../components/Toast';

export default function Schedule() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scheduling states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scheduleResult, setScheduleResult] = useState(null);
  const [showDsaDetails, setShowDsaDetails] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const p = await getProject(id);
        setProject(p);

        const t = await getTasks(id);
        setTasks(t);

        const d = await getDependencies(id);
        setDependencies(d);

        // Pre-run scheduler if tasks exist
        if (t.length > 0) {
          const res = generateSchedule(t, d);
          setScheduleResult(res);
        }
      } catch (err) {
        console.error('Error loading project for schedule', err);
        addToast('Error loading schedule: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleGenerateSchedule = () => {
    setIsAnalyzing(true);

    // Simulate clean animation tick for algorithm execution feel
    setTimeout(() => {
      const result = generateSchedule(tasks, dependencies);
      setScheduleResult(result);
      setIsAnalyzing(false);

      if (result.success) {
        addToast('Schedule generated successfully!');
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch {
          // ignore if canvas-confetti unavailable
        }
      } else {
        addToast(result.message || 'Scheduling failed', 'error');
      }
    }, 600);
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading schedule analysis..." />;
  }

  if (!project) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ color: 'var(--primary-navy)', fontFamily: 'var(--font-heading)' }}>Project not found or access denied</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>The requested project does not exist or you do not have permission to access it.</p>
        <Link to="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ProjectStepsNav project={project} />

      <div className="page-container">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-blue)', fontWeight: 700 }}>
              Step 4 of 6 • Algorithm Execution
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              Automatic Schedule
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Computes topological sort order, calculates earliest start times, and identifies the project critical path.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              icon={Play}
              loading={isAnalyzing}
              onClick={handleGenerateSchedule}
              disabled={tasks.length === 0}
            >
              {isAnalyzing ? 'Analyzing project dependencies...' : 'Generate Schedule'}
            </Button>

            {scheduleResult?.success && (
              <Link to={`/projects/${id}/critical-path`}>
                <Button variant="navy" size="lg" icon={ArrowRight}>
                  Next: Critical Path
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Loading Indicator during execution */}
        {isAnalyzing && (
          <div
            className="card"
            style={{
              padding: '3rem',
              textAlign: 'center',
              marginBottom: '2rem',
              background: '#ffffff'
            }}
          >
            <LoadingSpinner fullPage={false} text="Analyzing project dependencies & executing Kahn's algorithm..." />
          </div>
        )}

        {/* Empty state if no tasks */}
        {!isAnalyzing && tasks.length === 0 && (
          <div
            className="card"
            style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <Layers size={36} style={{ margin: '0 auto 1rem', color: 'var(--accent-blue)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              No tasks added yet
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Add tasks to this project first before generating a schedule.
            </p>
            <Link to={`/projects/${id}/tasks`}>
              <Button variant="primary">Add Tasks Now</Button>
            </Link>
          </div>
        )}

        {/* Circular Dependency Error Display */}
        {!isAnalyzing && scheduleResult && !scheduleResult.success && scheduleResult.errorType === 'CIRCULAR_DEPENDENCY' && (
          <div
            className="alert alert-danger"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '2rem'
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={28} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Scheduling cannot be generated because a circular dependency exists.
                </h3>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                  {scheduleResult.details || scheduleResult.message}
                </p>
                {scheduleResult.cycleNames && scheduleResult.cycleNames.length > 0 && (
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      color: '#991b1b',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      display: 'inline-block'
                    }}
                  >
                    Cycle Loop: {scheduleResult.cycleNames.join(' → ')}
                  </div>
                )}
                <div style={{ marginTop: '1rem' }}>
                  <Link to={`/projects/${id}/dependencies`}>
                    <Button variant="danger" size="sm">
                      Resolve Circular Dependencies in Dependency Manager
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Successful Schedule Results */}
        {!isAnalyzing && scheduleResult && scheduleResult.success && (
          <div>
            {/* Success Banner */}
            <div
              className="alert alert-success"
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={22} color="var(--success-green)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Schedule generated successfully.
                </span>
              </div>
              <span style={{ fontSize: '0.85rem' }}>
                All {scheduleResult.totalTasks} tasks sorted in valid topological sequence
              </span>
            </div>

            {/* Minimum Project Completion Time Stat Banner */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: '#ffffff',
                marginBottom: '2rem',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700 }}>
                    Minimum Project Completion Time
                  </span>
                  <div style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: '#38bdf8', lineHeight: '1.2', marginTop: '0.25rem' }}>
                    {formatDuration(scheduleResult.projectDuration)}
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                    Calculated dynamically by computing the longest path in the task Directed Acyclic Graph (DAG).
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Total Tasks</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{scheduleResult.totalTasks}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Dependencies</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{scheduleResult.totalDependencies}</div>
                  </div>

                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600 }}>Critical Tasks</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>{scheduleResult.criticalTasks.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Order Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Execution Order
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Valid sequence generated by Kahn's Topological Sort algorithm:
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheduleResult.executionOrder.map((task, index) => {
                  const metrics = scheduleResult.taskMetrics[task.id] || {};
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.875rem 1.25rem',
                        background: metrics.isCritical ? 'var(--critical-red-bg)' : 'var(--bg-subtle)',
                        border: `1px solid ${metrics.isCritical ? 'var(--critical-red-border)' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius-md)',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: metrics.isCritical ? 'var(--critical-red)' : 'var(--primary-navy)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 800
                          }}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {task.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Duration: {formatDuration(task.duration)}
                            {task.description && ` • ${task.description}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Schedule Window:</span>{' '}
                          <strong style={{ color: 'var(--text-main)' }}>
                            Day {metrics.earliestStart ?? 0} → Day {metrics.earliestFinish ?? task.duration}
                          </strong>
                        </div>
                        {metrics.isCritical ? (
                          <span className="badge badge-critical">
                            <Zap size={12} />
                            Critical
                          </span>
                        ) : (
                          <span className="badge badge-pending">
                            Slack: {metrics.slack}d
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Academic DSA Execution Trace Toggle */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div
                onClick={() => setShowDsaDetails(!showDsaDetails)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={18} color="var(--accent-blue)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-navy)' }}>
                    View Technical Kahn's Algorithm Step Traces & Adjacency List
                  </span>
                </div>
                {showDsaDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {showDsaDetails && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
                    1. Graph Adjacency List Representation (JavaScript Object Map):
                  </h4>
                  <pre
                    style={{
                      background: '#0f172a',
                      color: '#38bdf8',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      overflowX: 'auto',
                      marginBottom: '1.25rem'
                    }}
                  >
                    {JSON.stringify(scheduleResult.adjacencyList, null, 2)}
                  </pre>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
                    2. Kahn's In-Degree BFS Algorithm Step Log:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {scheduleResult.dsaSteps?.map((step) => (
                      <div
                        key={step.stepNumber}
                        style={{
                          background: 'var(--bg-subtle)',
                          padding: '0.625rem 0.875rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                          Step {step.stepNumber}: {step.action}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {step.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DsaExplainer defaultExpanded={false} />
      </div>
    </div>
  );
}
