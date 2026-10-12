import React from 'react';
import { Zap, Clock, ArrowDown, Calendar } from 'lucide-react';
import { formatDuration } from '../utils/helpers';

export default function CriticalPathCard({
  task,
  stepNumber,
  isLast = false
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          borderLeft: '5px solid var(--critical-red)',
          boxShadow: 'var(--shadow-md)',
          padding: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--critical-red-bg)',
                color: 'var(--critical-red)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '700'
              }}
            >
              {stepNumber}
            </span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {task.name}
            </h4>
          </div>
          <span className="badge badge-critical">
            <Zap size={12} />
            Critical Task
          </span>
        </div>

        {task.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
            {task.description}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            background: 'var(--bg-subtle)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            textAlign: 'center'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Duration</span>
            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
              {formatDuration(task.duration)}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Earliest Start</span>
            <div style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>
              Day {task.earliestStart ?? 0}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Earliest Finish</span>
            <div style={{ fontWeight: '700', color: 'var(--critical-red)' }}>
              Day {task.earliestFinish ?? task.duration}
            </div>
          </div>
        </div>
      </div>

      {!isLast && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0.5rem 0',
            color: 'var(--critical-red)'
          }}
        >
          <div style={{ width: '2px', height: '14px', background: 'var(--critical-red)' }} />
          <ArrowDown size={20} />
        </div>
      )}
    </div>
  );
}
