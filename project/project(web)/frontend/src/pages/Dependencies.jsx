import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getProject,
  getTasks,
  getDependencies,
  createDependency,
  deleteDependency
} from '../firebase/firestore';
import { generateSchedule } from '../algorithms/scheduler';
import {
  GitBranch,
  ArrowRight,
  Plus,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Layers
} from 'lucide-react';
import ProjectStepsNav from '../components/ProjectStepsNav';
import Button from '../components/Button';
import DependencyCard from '../components/DependencyCard';
import { Select } from '../components/Input';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function Dependencies() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [predecessorId, setPredecessorId] = useState('');
  const [successorId, setSuccessorId] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Cycle check state
  const [cycleWarning, setCycleWarning] = useState(null);

  // Delete modal state
  const [depToDelete, setDepToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getProject(id);
      setProject(p);

      const t = await getTasks(id);
      setTasks(t);

      const d = await getDependencies(id);
      setDependencies(d);

      // Run cycle detection check
      if (t.length > 0) {
        const sched = generateSchedule(t, d);
        if (!sched.success && sched.errorType === 'CIRCULAR_DEPENDENCY') {
          setCycleWarning({
            message: sched.message,
            details: sched.details,
            cycleNames: sched.cycleNames
          });
        } else {
          setCycleWarning(null);
        }
      }
    } catch (err) {
      console.error('Error fetching dependencies', err);
      addToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddDependency = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!predecessorId) {
      setFormError('Please select the previous (predecessor) task.');
      return;
    }
    if (!successorId) {
      setFormError('Please select the next (successor) task.');
      return;
    }
    if (predecessorId === successorId) {
      setFormError('A task cannot depend on itself.');
      return;
    }

    // Check duplicate
    const exists = dependencies.some(
      (d) => d.predecessorId === predecessorId && d.successorId === successorId
    );
    if (exists) {
      setFormError('This dependency already exists.');
      return;
    }

    // Proactive Cycle Check before adding
    const simulatedDeps = [
      ...dependencies,
      { predecessorId, successorId }
    ];
    const schedCheck = generateSchedule(tasks, simulatedDeps);
    if (!schedCheck.success && schedCheck.errorType === 'CIRCULAR_DEPENDENCY') {
      setFormError(
        `Cannot add this dependency: Circular dependency detected (${schedCheck.details || 'loop formed'}).`
      );
      return;
    }

    setSaving(true);
    try {
      const created = await createDependency(id, predecessorId, successorId);
      const newDeps = [...dependencies, created];
      setDependencies(newDeps);
      setPredecessorId('');
      setSuccessorId('');
      setCycleWarning(null);
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      addToast('Dependency added successfully');
    } catch (err) {
      setFormError(err.message || 'Failed to add dependency.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteDependency = async () => {
    if (!depToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDependency(depToDelete.id);
      const newDeps = dependencies.filter((d) => d.id !== depToDelete.id);
      setDependencies(newDeps);
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      addToast('Dependency removed');
      setDepToDelete(null);

      // Re-check cycles
      const sched = generateSchedule(tasks, newDeps);
      if (!sched.success && sched.errorType === 'CIRCULAR_DEPENDENCY') {
        setCycleWarning({
          message: sched.message,
          details: sched.details,
          cycleNames: sched.cycleNames
        });
      } else {
        setCycleWarning(null);
      }
    } catch (err) {
      addToast('Failed to delete dependency: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading dependencies..." />;
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

  const taskMap = new Map();
  tasks.forEach((t) => taskMap.set(t.id, t));

  const taskOptions = tasks.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.duration}d)`
  }));

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
              Step 3 of 6
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              Task Dependencies
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Select which task must be completed before another task can start.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/projects/${id}/tasks`}>
              <Button variant="secondary">
                Edit Tasks
              </Button>
            </Link>
            <Link to={`/projects/${id}/schedule`}>
              <Button variant="primary" icon={ArrowRight}>
                Next: Generate Schedule
              </Button>
            </Link>
          </div>
        </div>

        {/* Circular Dependency Alert Card */}
        {cycleWarning && (
          <div
            className="alert alert-danger"
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}
          >
            <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Circular dependency detected.
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                {cycleWarning.details || cycleWarning.message}
              </p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', opacity: 0.9 }}>
                Circular dependencies create an infinite wait condition where no task in the loop can ever start. Delete one of the conflicting dependencies below to restore DAG flow.
              </p>
            </div>
          </div>
        )}

        {/* Add Dependency Form Card */}
        <Card
          title="Add New Dependency"
          subtitle="Form a directed edge: Previous Task must finish before Next Task can begin."
          style={{ marginBottom: '2rem' }}
        >
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{formError}</div>
            </div>
          )}

          {tasks.length < 2 ? (
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              You need at least <strong>2 tasks</strong> in this project before creating dependencies.
              <Link to={`/projects/${id}/tasks`} style={{ color: 'var(--accent-blue)', marginLeft: '0.5rem', fontWeight: 600 }}>
                Go to Tasks →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleAddDependency}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.25rem',
                  alignItems: 'flex-end'
                }}
              >
                <Select
                  id="dep-predecessor"
                  label="Previous Task (Must finish first):"
                  value={predecessorId}
                  onChange={(e) => setPredecessorId(e.target.value)}
                  options={taskOptions}
                  placeholder="Select predecessor task..."
                  required
                />

                <div style={{ textAlign: 'center', paddingBottom: '1.5rem', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
                  ↓ depends on
                </div>

                <Select
                  id="dep-successor"
                  label="Next Task (Can start after):"
                  value={successorId}
                  onChange={(e) => setSuccessorId(e.target.value)}
                  options={taskOptions}
                  placeholder="Select successor task..."
                  required
                />

                <div style={{ paddingBottom: '1.25rem' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Plus}
                    loading={saving}
                    style={{ width: '100%' }}
                  >
                    Add Dependency
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Card>

        {/* Existing Dependency List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Current Dependencies ({dependencies.length})
            </h2>
          </div>

          {loading ? (
            <LoadingSpinner fullPage={false} text="Loading dependencies..." />
          ) : dependencies.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No dependencies defined yet."
              description="Without dependencies, all tasks will be scheduled to start in parallel at Day 0. Connect tasks to sequence them."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dependencies.map((dep) => (
                <DependencyCard
                  key={dep.id}
                  dependency={dep}
                  predecessorTask={taskMap.get(dep.predecessorId)}
                  successorTask={taskMap.get(dep.successorId)}
                  onDelete={() => setDepToDelete(dep)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete Modal */}
        <ConfirmDialog
          isOpen={Boolean(depToDelete)}
          onClose={() => setDepToDelete(null)}
          onConfirm={confirmDeleteDependency}
          title="Remove Dependency?"
          message="Are you sure you want to remove this dependency connection? The successor task will no longer wait for the predecessor."
          confirmText="Remove"
          loading={isDeleting}
        />
      </div>
    </div>
  );
}
