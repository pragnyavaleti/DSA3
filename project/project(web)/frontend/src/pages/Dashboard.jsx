import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getUserProjects,
  deleteProject,
  getTasks,
  loadSampleProject,
  getDependencies
} from '../firebase/firestore';
import { generateSchedule } from '../algorithms/scheduler';
import {
  FolderPlus,
  Layers,
  FolderKanban,
  CheckCircle,
  Clock,
  Sparkles,
  Plus,
  RefreshCw,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import DsaExplainer from '../components/DsaExplainer';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  // Overall metric totals strictly for the currently authenticated user
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0
  });

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetAllState = () => {
    setProjects([]);
    setProjectStats({});
    setMetrics({
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0
    });
  };

  const fetchProjects = async () => {
    if (!currentUser?.uid) {
      resetAllState();
      setLoading(false);
      return;
    }

    try {
      // Query projects strictly for current user UID
      const list = await getUserProjects(currentUser.uid);
      setProjects(list);

      // Pre-calculate task counts & durations & status breakdown for each project
      const statsMap = {};
      let activeCount = 0;
      let completedCount = 0;
      let totTasks = 0;
      let totPending = 0;
      let totInProgress = 0;
      let totCompleted = 0;

      for (const p of list) {
        try {
          const tasks = await getTasks(p.id);
          const deps = await getDependencies(p.id);
          let duration = null;
          let criticalCount = null;

          const pPending = tasks.filter((t) => t.status === 'Pending').length;
          const pInProgress = tasks.filter((t) => t.status === 'In Progress').length;
          const pCompleted = tasks.filter((t) => t.status === 'Completed').length;

          let pStatus = 'Planning';
          if (tasks.length > 0 && pCompleted === tasks.length) {
            pStatus = 'Completed';
            completedCount++;
          } else if (pInProgress > 0 || pCompleted > 0) {
            pStatus = 'In Progress';
            activeCount++;
          } else {
            pStatus = 'Planning';
          }

          if (tasks.length > 0) {
            const sched = generateSchedule(tasks, deps);
            if (sched.success) {
              duration = sched.projectDuration;
              criticalCount = sched.criticalTasks.length;
            }
          }

          totTasks += tasks.length;
          totPending += pPending;
          totInProgress += pInProgress;
          totCompleted += pCompleted;

          statsMap[p.id] = {
            taskCount: tasks.length,
            duration,
            criticalCount,
            pendingTasks: pPending,
            inProgressTasks: pInProgress,
            completedTasks: pCompleted,
            status: pStatus
          };
        } catch (e) {
          statsMap[p.id] = {
            taskCount: 0,
            duration: null,
            criticalCount: null,
            pendingTasks: 0,
            inProgressTasks: 0,
            completedTasks: 0,
            status: 'Planning'
          };
        }
      }

      setProjectStats(statsMap);
      setMetrics({
        totalProjects: list.length,
        activeProjects: activeCount,
        completedProjects: completedCount,
        totalTasks: totTasks,
        pendingTasks: totPending,
        inProgressTasks: totInProgress,
        completedTasks: totCompleted
      });
    } catch (err) {
      console.error('Failed to load projects', err);
      addToast('Failed to load projects: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // When authentication is not resolved or logged out, wipe all project data
    if (!currentUser?.uid) {
      resetAllState();
      setLoading(false);
      return;
    }

    // Reset previous account state immediately before loading new user data
    resetAllState();
    setLoading(true);
    fetchProjects();

    // Auto-refresh when custom events trigger or window gets focus
    const handleUpdate = () => {
      if (currentUser?.uid) {
        fetchProjects();
      }
    };

    const handleLogoutEvent = () => {
      resetAllState();
    };

    window.addEventListener('dsa-project-updated', handleUpdate);
    window.addEventListener('dsa-auth-logout', handleLogoutEvent);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('dsa-project-updated', handleUpdate);
      window.removeEventListener('dsa-auth-logout', handleLogoutEvent);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [currentUser?.uid]);

  const handleCreateSample = async () => {
    if (!currentUser) return;
    setLoadingSample(true);
    try {
      const proj = await loadSampleProject(currentUser.uid);
      addToast(`Sample project "${proj.name}" created!`);
      // Notify other views
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      await fetchProjects();
      navigate(`/projects/${proj.id}`);
    } catch (err) {
      addToast('Error loading sample project: ' + err.message, 'error');
    } finally {
      setLoadingSample(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      addToast(`Project "${projectToDelete.name}" deleted`);
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
      await fetchProjects();
    } catch (err) {
      addToast('Failed to delete project: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine greeting based on current local hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-container">
      {/* Welcome Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)', letterSpacing: '-0.02em' }}>
            {greeting}, {currentUser?.name || 'User'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            Welcome to your project planning workspace. Automatic live updates enabled.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={Sparkles}
            onClick={handleCreateSample}
            loading={loadingSample}
            title="Create distinct sample project with pre-built tasks"
          >
            Load Sample Project
          </Button>

          <Link to="/projects/new">
            <Button variant="primary" icon={Plus}>
              + Create New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards with Real-time Status Breakdown */}
      <div className="stats-grid">
        <StatCard
          icon={FolderKanban}
          label="Total Projects"
          value={metrics.totalProjects}
          variant="blue"
          subtext={`${metrics.activeProjects} Active • ${metrics.completedProjects} Completed`}
        />
        <StatCard
          icon={Clock}
          label="Active Projects"
          value={metrics.activeProjects}
          variant="navy"
          subtext="In Progress or Execution"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Projects"
          value={metrics.completedProjects}
          variant="green"
          subtext="All tasks finished"
        />
        <StatCard
          icon={Layers}
          label="Total Tasks"
          value={metrics.totalTasks}
          variant="blue"
          subtext={`${metrics.inProgressTasks} In Progress • ${metrics.pendingTasks} Pending`}
        />
      </div>

      {/* Task Status Overview Pill Bar */}
      {metrics.totalTasks > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-navy)' }}>
            <ListTodo size={18} color="var(--accent-blue)" />
            <span>Workspace Task Status Breakdown:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.825rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#047857', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-green)' }} />
              {metrics.completedTasks} Completed
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }} />
              {metrics.inProgressTasks} In Progress
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
              {metrics.pendingTasks} Pending
            </span>
          </div>
        </div>
      )}

      {/* Your Projects Section */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Your Projects
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Select a project to manage tasks and dependencies
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner fullPage={false} text="Loading your projects..." />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="No projects yet."
            description="Create your first project to start modeling tasks, building directed graphs, and calculating the Critical Path."
            actionText="Create Your First Project"
            onAction={() => navigate('/projects/new')}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {projects.map((project) => {
              const stats = projectStats[project.id] || {};
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  taskCount={stats.taskCount}
                  duration={stats.duration}
                  criticalCount={stats.criticalCount}
                  pendingTasks={stats.pendingTasks}
                  inProgressTasks={stats.inProgressTasks}
                  completedTasks={stats.completedTasks}
                  status={stats.status}
                  onDelete={() => setProjectToDelete(project)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Academic DSA Explainer Box */}
      <DsaExplainer defaultExpanded={false} />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${projectToDelete?.name}"? All associated tasks and dependencies will be removed.`}
        confirmText="Delete Project"
        loading={isDeleting}
      />
    </div>
  );
}
