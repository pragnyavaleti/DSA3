import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...', fullPage = false }) {
  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}
      >
        <Loader2
          size={36}
          color="var(--accent-blue)"
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
          {text}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
      <Loader2
        size={18}
        color="var(--accent-blue)"
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <span style={{ fontSize: '0.85rem' }}>{text}</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      className="card"
      style={{
        height: '140px',
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite',
        border: '1px solid var(--border-light)'
      }}
    />
  );
}
