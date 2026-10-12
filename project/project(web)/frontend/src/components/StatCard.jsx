import React from 'react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  variant = 'blue', // 'blue', 'navy', 'red', 'green'
  subtext
}) {
  const isLongText = typeof value === 'string' && value.length > 7;

  return (
    <div className="stat-card">
      {Icon && (
        <div className={`stat-icon ${variant}`}>
          <Icon size={20} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="stat-label" title={label}>{label}</p>
        <p
          className={`stat-value ${isLongText ? 'text-sm' : ''}`}
          title={String(value)}
        >
          {value}
        </p>
        {subtext && (
          <p
            style={{
              fontSize: '0.725rem',
              color: 'var(--text-muted)',
              marginTop: '0.15rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={subtext}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
