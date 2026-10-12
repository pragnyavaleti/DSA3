import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  style = {},
  id
}) {
  return (
    <div id={id} className={`card ${className}`} style={style}>
      {(title || action || subtitle) && (
        <div className="card-header" style={{ alignItems: subtitle ? 'flex-start' : 'center' }}>
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
