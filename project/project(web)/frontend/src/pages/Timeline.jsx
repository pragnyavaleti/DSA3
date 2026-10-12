import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, getTasks, getDependencies } from '../firebase/firestore';
import { generateSchedule } from '../algorithms/scheduler';
import { formatDuration } from '../utils/helpers';
import {
  Calendar,
  Clock,
  Zap,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import ProjectStepsNav from '../components/ProjectStepsNav';
import Button from '../components/Button';
import Card from '../components/Card';
import Timeline from '../components/Timeline';
import LoadingSpinner from '../components/LoadingSpinner';
import DsaExplainer from '../components/DsaExplainer';

export default function ProjectTimelinePage() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

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

        if (t.length > 0) {
          const res = generateSchedule(t, d);
          setSchedule(res);
        }
      } catch (err) {
        console.error('Error loading timeline data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullPage text="Generating dynamic project timeline..." />;
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

  const isCycle = schedule && !schedule.success && schedule.errorType === 'CIRCULAR_DEPENDENCY';
  const hasSchedule = schedule && schedule.success;

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
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--success-green)', fontWeight: 700 }}>
              Step 6 of 6 • Gantt Scheduling Visualizer
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              Project Timeline
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.2rem', maxWidth: '720px' }}>
              Visual Gantt chart dynamically calculated from task durations and graph dependencies. Identify parallel tasks and critical deadlines.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/projects/${id}/critical-path`}>
              <Button variant="secondary" icon={Zap}>
                Back to Critical Path
              </Button>
            </Link>
          </div>
        </div>

        {/* Circular Dependency Warning */}
        {isCycle && (
          <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
            <AlertTriangle size={24} style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Cannot render timeline: Circular Dependency
              </h3>
              <p>{schedule.details || schedule.message}</p>
              <div style={{ marginTop: '0.75rem' }}>
                <Link to={`/projects/${id}/dependencies`}>
                  <Button variant="danger" size="sm">Fix Dependencies</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Gantt Timeline Component */}
        {hasSchedule && (
          <div style={{ marginBottom: '2rem' }}>
            <Timeline scheduleResult={schedule} tasks={tasks} />
          </div>
        )}

        {/* Explanatory cards */}
        {hasSchedule && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                Start & Finish Days
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Earliest Start (ES) is determined by the maximum Earliest Finish (EF) among all predecessor tasks. Day 0 represents the beginning of the project.
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                Parallel Task Execution
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Independent tasks whose predecessors have all completed can execute simultaneously in parallel, minimizing total project elapsed time.
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--critical-red)', marginBottom: '0.35rem' }}>
                Critical Path Constraints
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Highlighted in red with zero float/slack. A 1-day delay on any critical task directly increases the total project completion time by 1 day.
              </p>
            </div>
          </div>
        )}

        <DsaExplainer defaultExpanded={false} />
      </div>
    </div>
  );
}
