import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Zap,
  Calendar,
  Layers
} from 'lucide-react';
import { formatDate, formatDuration } from '../utils/helpers';

export default function ProjectCard({
  project,
  taskCount = 0,
  duration = null,
  criticalCount = null,
  pendingTasks = 0,
  inProgressTasks = 0,
  completedTasks = 0,
  status = 'Planning',
  onDelete
}) {
  const getStatusBadge = () => {
    switch (status) {
      case 'Completed':
        return (
          <span className="badge badge-completed">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="badge badge-in-progress">
            <Clock size={12} />
            In Progress
          </span>
        );
      case 'Planning':
      default:
        return (
          <span className="badge badge-pending">
            <Calendar size={12} />
            Planning
          </span>
        );
    }
  };

  // Completion percentage
  const completedPct = taskCount > 0 ? (completedTasks / taskCount) * 100 : 0;
  const inProgressPct = taskCount > 0 ? (inProgressTasks / taskCount) * 100 : 0;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-blue-light)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FolderKanban size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', wordBreak: 'break-word' }}>
              {project.name}
            </h3>
          </div>

          <div>{getStatusBadge()}</div>
        </div>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            lineHeight: '1.5',
            minHeight: '2.8rem'
          }}
        >
          {project.description || 'No description provided.'}
        </p>

        {/* Real-time Status Breakdown Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexWrap: 'wrap',
            marginBottom: '0.875rem',
            fontSize: '0.75rem'
          }}
        >
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
            {completedTasks} Completed
          </span>
          <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
            {inProgressTasks} In Progress
          </span>
          <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
            {pendingTasks} Pending
          </span>
        </div>

        {/* Mini Progress Bar */}
        <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: '1rem' }}>
          <div style={{ width: `${completedPct}%`, background: 'var(--success-green)', height: '100%', transition: 'width 0.3s ease' }} title={`${Math.round(completedPct)}% Completed`} />
          <div style={{ width: `${inProgressPct}%`, background: 'var(--accent-blue)', height: '100%', transition: 'width 0.3s ease' }} title={`${Math.round(inProgressPct)}% In Progress`} />
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            background: 'var(--bg-subtle)',
            padding: '0.875rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.8rem'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Tasks:</span>
            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {duration !== null ? formatDuration(duration) : 'Pending'}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Critical Tasks:</span>
            <div style={{ fontWeight: '700', color: criticalCount > 0 ? 'var(--critical-red)' : 'var(--text-main)', fontSize: '0.95rem' }}>
              {criticalCount !== null ? criticalCount : 'Pending'}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Updated:</span>
            <div style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {formatDate(project.updatedAt || project.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.875rem',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <button
          type="button"
          onClick={() => onDelete(project)}
          className="btn btn-secondary btn-sm"
          style={{ color: '#ef4444' }}
          title="Delete Project"
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </button>

        <Link
          to={`/projects/${project.id}`}
          className="btn btn-primary btn-sm"
          style={{ gap: '0.35rem' }}
        >
          <span>Open Project</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
