import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, getTasks, getDependencies, updateProject, deleteProject } from '../firebase/firestore';
import { generateSchedule } from '../algorithms/scheduler';
import { formatDate, formatDuration } from '../utils/helpers';
import {
  Layers,
  CheckCircle2,
  Clock,
  Zap,
  Plus,
  GitBranch,
  Play,
  Calendar,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  ListTodo,
  Edit2,
  Trash2
} from 'lucide-react';
import ProjectStepsNav from '../components/ProjectStepsNav';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { Input, TextArea } from '../components/Input';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import DsaExplainer from '../components/DsaExplainer';
import { useToast } from '../components/Toast';

export default function ProjectOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit project modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete project modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openEditModal = () => {
    if (!project) return;
    setEditName(project.name || '');
    setEditDescription(project.description || '');
    setEditStartDate(project.startDate || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editName.trim()) {
      setEditError('Project name is required and cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated = await updateProject(project.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        startDate: editStartDate || project.startDate
      });
      setProject(prev => ({ ...prev, ...updated }));
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      addToast('Project updated successfully');
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update project.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      addToast(`Project "${project.name}" deleted successfully`);
      navigate('/dashboard');
    } catch (err) {
      addToast('Failed to delete project: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadData = async () => {
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
      } else {
        setSchedule(null);
      }
    } catch (err) {
      console.error('Failed to load project details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();

    // Live auto-refresh when tasks or dependencies are added or updated
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('dsa-project-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('dsa-project-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullPage text="Loading project details..." />;
  }

  if (!project) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Project not found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>The requested project does not exist.</p>
        <Link to="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Calculate task counts by execution status
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;

  const completedPct = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const inProgressPct = tasks.length > 0 ? (inProgressTasks / tasks.length) * 100 : 0;
  const pendingPct = tasks.length > 0 ? (pendingTasks / tasks.length) * 100 : 0;

  let projectStatus = 'Planning';
  if (tasks.length > 0 && completedTasks === tasks.length) {
    projectStatus = 'Completed';
  } else if (inProgressTasks > 0 || completedTasks > 0) {
    projectStatus = 'In Progress';
  } else {
    projectStatus = 'Planning';
  }

  const durationDisplay =

    tasks.length === 0
      ? '0 days'
      : schedule && schedule.success
      ? formatDuration(schedule.projectDuration)
      : 'Pending';

  const criticalCountDisplay =
    tasks.length === 0
      ? '0'
      : schedule && schedule.success
      ? schedule.criticalTasks.length
      : 'Pending';


  return (
    <div>
      <ProjectStepsNav project={project} />

      <div className="page-container">
        {/* Project Header Info Card */}
        <div
          className="card"
          style={{
            marginBottom: '1.75rem',
            background: '#ffffff',
            borderLeft: '5px solid var(--accent-blue)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-blue)', fontWeight: 700 }}>
                  Step 1 of 6 • Project Overview
                </span>

                {projectStatus === 'Completed' ? (
                  <span className="badge badge-completed">
                    <CheckCircle2 size={12} />
                    Project Completed
                  </span>
                ) : projectStatus === 'In Progress' ? (
                  <span className="badge badge-in-progress">
                    <Clock size={12} />
                    In Progress
                  </span>
                ) : (
                  <span className="badge badge-pending">
                    <Calendar size={12} />
                    Planning Phase
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                {project.name}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '780px', lineHeight: '1.5' }}>
                {project.description || 'No description provided for this project.'}
              </p>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div>Created: <strong style={{ color: 'var(--text-main)' }}>{formatDate(project.createdAt)}</strong></div>
              {project.startDate && (
                <div style={{ marginTop: '0.2rem' }}>
                  Target Start: <strong style={{ color: 'var(--text-main)' }}>{formatDate(project.startDate)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <Button variant="secondary" size="sm" icon={Edit2} onClick={openEditModal} title="Edit Project Details">
                  Edit Project
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => setIsDeleteModalOpen(true)} title="Delete Project">
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Multi-segment Real-time Task Progress Bar */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Execution Progress</span>
              
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <span style={{ color: '#047857' }}>● {completedTasks} Completed ({Math.round(completedPct)}%)</span>
                <span style={{ color: '#1d4ed8' }}>● {inProgressTasks} In Progress ({Math.round(inProgressPct)}%)</span>
                <span style={{ color: '#475569' }}>● {pendingTasks} Pending ({Math.round(pendingPct)}%)</span>
              </div>
            </div>

            <div style={{ height: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: `${completedPct}%`,
                  height: '100%',
                  background: 'var(--success-green)',
                  transition: 'width 0.4s ease'
                }}
                title={`${completedTasks} Completed`}
              />
              <div
                style={{
                  width: `${inProgressPct}%`,
                  height: '100%',
                  background: 'var(--accent-blue)',
                  transition: 'width 0.4s ease'
                }}
                title={`${inProgressTasks} In Progress`}
              />
              <div
                style={{
                  width: `${pendingPct}%`,
                  height: '100%',
                  background: '#cbd5e1',
                  transition: 'width 0.4s ease'
                }}
                title={`${pendingTasks} Pending`}
              />
            </div>
          </div>
        </div>

        {/* Real-time Statistics Cards (Balanced 6-Column Layout) */}
        <div className="stats-grid-6">
          <StatCard
            icon={Layers}
            label="Total Tasks"
            value={tasks.length}
            variant="blue"
            subtext={`${dependencies.length} dependencies defined`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Tasks"
            value={completedTasks}
            variant="green"
            subtext={`${Math.round(completedPct)}% completed`}
          />
          <StatCard
            icon={Clock}
            label="In Progress Tasks"
            value={inProgressTasks}
            variant="navy"
            subtext="Active execution"
          />
          <StatCard
            icon={ListTodo}
            label="Pending Tasks"
            value={pendingTasks}
            variant="blue"
            subtext="Awaiting start"
          />
          <StatCard
            icon={Clock}
            label="Project Duration"
            value={durationDisplay}
            variant="navy"
            subtext="Calculated via CPM DAG"
          />
          <StatCard
            icon={Zap}
            label="Critical Tasks"
            value={criticalCountDisplay}
            variant="red"
            subtext="Zero slack time allowance"
          />
        </div>

        {/* Circular Dependency Warning Banner (if exists) */}
        {schedule && !schedule.success && schedule.errorType === 'CIRCULAR_DEPENDENCY' && (
          <div className="alert alert-danger" style={{ marginBottom: '1.75rem' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.2rem' }}>Circular Dependency Detected</div>
              <div>{schedule.details || schedule.message}</div>
              <div style={{ marginTop: '0.5rem' }}>
                <Link to={`/projects/${project.id}/dependencies`}>
                  <Button variant="danger" size="sm">Fix Dependencies</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Actions Workflow Grid */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Project Workflow Navigation
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* Step 2: Tasks */}
            <div
              className="card"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={18} />
                  </div>
                  <span className="badge badge-pending">Step 2</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Task Management
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Add, edit, or adjust task durations & status.
                </p>
              </div>
              <Link to={`/projects/${project.id}/tasks`}>
                <Button variant="outline" size="sm" icon={Plus} style={{ width: '100%' }}>
                  + Manage Tasks
                </Button>
              </Link>
            </div>

            {/* Step 3: Dependencies */}
            <div
              className="card"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GitBranch size={18} />
                  </div>
                  <span className="badge badge-pending">Step 3</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Dependencies
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Connect predecessor & successor tasks.
                </p>
              </div>
              <Link to={`/projects/${project.id}/dependencies`}>
                <Button variant="outline" size="sm" icon={GitBranch} style={{ width: '100%' }}>
                  Manage Dependencies
                </Button>
              </Link>
            </div>

            {/* Step 4: Schedule */}
            <div
              className="card"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.08)', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={18} />
                  </div>
                  <span className="badge badge-pending">Step 4</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Schedule Analysis
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Run Kahn's topological sort order.
                </p>
              </div>
              <Link to={`/projects/${project.id}/schedule`}>
                <Button variant="primary" size="sm" icon={Play} style={{ width: '100%' }}>
                  Generate Schedule
                </Button>
              </Link>
            </div>

            {/* Step 5: Critical Path */}
            <div
              className="card"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--critical-red-bg)', color: 'var(--critical-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                  </div>
                  <span className="badge badge-pending">Step 5</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Critical Path
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Find bottlenecks with zero float.
                </p>
              </div>
              <Link to={`/projects/${project.id}/critical-path`}>
                <Button variant="secondary" size="sm" icon={Zap} style={{ width: '100%' }}>
                  View Critical Path
                </Button>
              </Link>
            </div>

            {/* Step 6: Timeline */}
            <div
              className="card"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--success-green-bg)', color: 'var(--success-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} />
                  </div>
                  <span className="badge badge-pending">Step 6</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Project Timeline
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Gantt-style parallel task timeline.
                </p>
              </div>
              <Link to={`/projects/${project.id}/timeline`}>
                <Button variant="secondary" size="sm" icon={Calendar} style={{ width: '100%' }}>
                  View Timeline
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Academic DSA Info */}
        <DsaExplainer defaultExpanded={false} />
      </div>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project"
        subtitle="Update project scope, title, or start date"
      >
        {editError && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>{editError}</div>
          </div>
        )}
        <form onSubmit={handleSaveEdit}>
          <Input
            id="edit-project-name"
            label="Project Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Mobile Banking App"
            required
          />
          <TextArea
            id="edit-project-desc"
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Describe project goals, deliverables, and scope..."
            rows={3}
          />
          <Input
            id="edit-project-date"
            label="Target Start Date"
            type="date"
            value={editStartDate}
            onChange={(e) => setEditStartDate(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSavingEdit}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${project?.name}"? All associated tasks, dependencies, and schedules will be permanently removed.`}
        confirmText="Delete Project"
        loading={isDeleting}
      />
    </div>
  );
}
