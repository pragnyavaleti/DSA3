import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, getTasks, getDependencies } from '../firebase/firestore';
import { generateSchedule } from '../algorithms/scheduler';
import { formatDuration } from '../utils/helpers';
import {
  Zap,
  ArrowRight,
  Clock,
  Layers,
  Network,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import ProjectStepsNav from '../components/ProjectStepsNav';
import Button from '../components/Button';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import CriticalPathCard from '../components/CriticalPathCard';
import GraphView from '../components/GraphView';
import LoadingSpinner from '../components/LoadingSpinner';
import DsaExplainer from '../components/DsaExplainer';

export default function CriticalPath() {
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
        console.error('Error loading critical path data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullPage text="Calculating Critical Path..." />;
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
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--critical-red)', fontWeight: 700 }}>
              Step 5 of 6 • Critical Path Method (CPM)
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              Critical Path Analysis
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.2rem', maxWidth: '720px' }}>
              The Critical Path is the sequence of dependent tasks that determines the minimum time required to complete the project.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/projects/${id}/timeline`}>
              <Button variant="primary" size="lg" icon={ArrowRight}>
                Next: Project Timeline
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
                Cannot compute Critical Path: Circular Dependency
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

        {/* Statistics Cards */}
        {hasSchedule && (
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <StatCard
              icon={Clock}
              label="Total Project Duration"
              value={formatDuration(schedule.projectDuration)}
              variant="blue"
              subtext="Minimum project completion time"
            />
            <StatCard
              icon={Zap}
              label="Critical Tasks"
              value={schedule.criticalTasks.length}
              variant="red"
              subtext="Tasks with zero slack (Float = 0)"
            />
            <StatCard
              icon={Layers}
              label="Total Tasks"
              value={schedule.totalTasks}
              variant="navy"
            />
            <StatCard
              icon={Network}
              label="Critical Path Sequence"
              value={`${schedule.criticalPath.length} steps`}
              variant="green"
              subtext="Direct bottleneck chain"
            />
          </div>
        )}

        {/* Critical Path Cards Sequence */}
        {hasSchedule && (
          <Card
            title="Critical Path Sequence"
            subtitle="Any delay in these critical tasks will directly delay the final completion of the entire project."
            style={{ marginBottom: '2.5rem' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
              {schedule.criticalPath.map((task, idx) => (
                <CriticalPathCard
                  key={task.id}
                  task={task}
                  stepNumber={idx + 1}
                  isLast={idx === schedule.criticalPath.length - 1}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Directed Graph Visualization */}
        {hasSchedule && (
          <Card
            title="Project Dependency Graph Visualization"
            subtitle="Directed acyclic graph (DAG) layout with vertices, directed edges, and highlighted critical path."
            style={{ marginBottom: '2rem' }}
          >
            <GraphView
              nodes={schedule.graphNodes}
              edges={schedule.graphEdges}
              criticalEdges={schedule.criticalEdges}
              criticalPath={schedule.criticalPath}
            />
          </Card>
        )}

        <DsaExplainer defaultExpanded={false} />
      </div>
    </div>
  );
}
