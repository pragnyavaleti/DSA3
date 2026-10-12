import React from 'react';
import Button from './Button';
import { FolderPlus, Layers, Plus } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Layers,
  title = 'No items found',
  description = 'Get started by creating your first item.',
  actionText,
  onAction,
  actionIcon: ActionIcon = Plus
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        background: '#ffffff',
        border: '2px dashed var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '540px',
        margin: '2rem auto'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--bg-subtle)',
          color: 'var(--accent-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}
      >
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" icon={ActionIcon} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
