import React from 'react';
import { Clock, Edit2, Trash2, GitFork, CheckCircle, Clock3, AlertCircle } from 'lucide-react';
import { formatDuration } from '../utils/helpers';

export default function TaskCard({
  task,
  predecessors = [], // Names or objects of tasks this task depends on
  onEdit,
  onDelete,
  onStatusChange
}) {
  const handleStatusSelect = (e) => {
    const newStatus = e.target.value;
    if (onStatusChange && newStatus !== task.status) {
      onStatusChange(task, newStatus);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="badge badge-completed">
            <CheckCircle size={12} />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="badge badge-in-progress">
            <Clock3 size={12} />
            In Progress
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="badge badge-pending">
            <Clock size={12} />
            Pending
          </span>
        );
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', wordBreak: 'break-word' }}>
            {task.name}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {onStatusChange ? (
              <select
                value={task.status || 'Pending'}
                onChange={handleStatusSelect}
                className={`badge ${task.status === 'Completed' ? 'badge-completed' : task.status === 'In Progress' ? 'badge-in-progress' : 'badge-pending'}`}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-main)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.4rem'
                }}
                title="Click to quickly change task status"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            ) : (
              getStatusBadge(task.status)
            )}
          </div>
        </div>

        {task.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.875rem', lineHeight: '1.4' }}>
            {task.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Clock size={16} color="var(--accent-blue)" />
          <span>Duration: <strong>{formatDuration(task.duration)}</strong></span>
        </div>

        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.25rem' }}>
            <GitFork size={14} />
            <span>Predecessors:</span>
          </div>
          {predecessors.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {predecessors.map((p, i) => (
                <span
                  key={i}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.75rem',
                    color: 'var(--primary-navy)',
                    fontWeight: '500'
                  }}
                >
                  {typeof p === 'object' ? p.name : p}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>None (Ready at Day 0)</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
        {onEdit && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onEdit(task)}
            title="Edit Task"
          >
            <Edit2 size={14} />
            <span>Edit</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(task)}
            title="Delete Task"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
