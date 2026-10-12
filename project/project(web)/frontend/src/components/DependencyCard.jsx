import React from 'react';
import { ArrowRight, Trash2, GitCommit } from 'lucide-react';

export default function DependencyCard({
  dependency,
  predecessorTask,
  successorTask,
  onDelete
}) {
  const predName = predecessorTask?.name || 'Task ' + dependency.predecessorId;
  const succName = successorTask?.name || 'Task ' + dependency.successorId;

  return (
    <div
      className="card"
      style={{
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
        <div
          style={{
            background: 'var(--accent-blue-light)',
            color: 'var(--accent-blue)',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex'
          }}
        >
          <GitCommit size={16} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              fontWeight: '600',
              color: 'var(--primary-navy)',
              background: 'var(--bg-subtle)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: '0.9rem'
            }}
          >
            {predName}
          </div>

          <div style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center' }}>
            <ArrowRight size={18} />
          </div>

          <div
            style={{
              fontWeight: '600',
              color: 'var(--primary-navy)',
              background: 'var(--bg-subtle)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: '0.9rem'
            }}
          >
            {succName}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {succName} requires {predName}
        </span>
        <button
          type="button"
          onClick={() => onDelete(dependency)}
          className="btn btn-secondary btn-sm"
          style={{ color: '#ef4444', padding: '0.35rem 0.5rem' }}
          title="Remove Dependency"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
