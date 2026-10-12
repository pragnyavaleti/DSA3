import React from 'react';
import { Zap, Clock, Calendar } from 'lucide-react';
import { formatDuration } from '../utils/helpers';

export default function Timeline({
  scheduleResult,
  tasks = []
}) {
  if (!scheduleResult || !scheduleResult.success) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No timeline available. Generate a schedule first to view the timeline.
      </div>
    );
  }

  const { projectDuration, taskMetrics, executionOrder } = scheduleResult;
  const totalDays = Math.max(1, Math.ceil(projectDuration));

  // Generate day tick array: Day 0 to Day totalDays
  const days = [];
  for (let i = 0; i <= totalDays; i++) {
    days.push(i);
  }

  // Column width percentage
  const colWidthPct = 100 / (totalDays + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Legend & Stats Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '3px',
                display: 'inline-block'
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Critical Path Task (Slack = 0)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                borderRadius: '3px',
                display: 'inline-block'
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Standard Task</span>
          </div>
        </div>

        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-navy)' }}>
          Total Duration: <span style={{ color: 'var(--accent-blue)' }}>{formatDuration(projectDuration)}</span>
        </div>
      </div>

      {/* Gantt Board */}
      <div className="timeline-board">
        <div style={{ minWidth: '720px' }}>
          {/* Header Row: Task Name Column + Day Ticks */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr',
              borderBottom: '2px solid var(--border-light)',
              paddingBottom: '0.75rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ fontWeight: '700', color: 'var(--primary-navy)', fontSize: '0.875rem' }}>
              Task Name
            </div>

            <div style={{ display: 'flex', width: '100%', position: 'relative' }}>
              {days.map((day) => (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--text-muted)'
                  }}
                >
                  Day {day}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {executionOrder.map((task) => {
              const metrics = taskMetrics[task.id] || {
                earliestStart: 0,
                earliestFinish: task.duration,
                slack: 0,
                isCritical: false
              };

              const startDay = metrics.earliestStart;
              const finishDay = metrics.earliestFinish;
              const duration = task.duration;

              // Calculate horizontal position
              const leftPct = (startDay / (totalDays || 1)) * 100;
              const widthPct = Math.max(2, (duration / (totalDays || 1)) * 100);

              return (
                <div
                  key={task.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px 1fr',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px dashed var(--border-light)',
                    position: 'relative'
                  }}
                >
                  {/* Task Label Cell */}
                  <div style={{ paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {metrics.isCritical && (
                        <Zap size={14} color="var(--critical-red)" style={{ flexShrink: 0 }} />
                      )}
                      <span
                        style={{
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={task.name}
                      >
                        {task.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Days {startDay} → {finishDay} ({formatDuration(duration)})
                      {metrics.slack > 0 && ` • Slack: ${metrics.slack}d`}
                    </div>
                  </div>

                  {/* Gantt Bar Lane */}
                  <div
                    style={{
                      height: '36px',
                      background: 'rgba(241, 245, 249, 0.6)',
                      borderRadius: 'var(--radius-sm)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {/* Grid vertical guidelines */}
                    {days.map((day) => (
                      <div
                        key={day}
                        style={{
                          position: 'absolute',
                          left: `${(day / (totalDays || 1)) * 100}%`,
                          top: 0,
                          bottom: 0,
                          width: '1px',
                          background: day === 0 || day === totalDays ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.04)',
                          pointerEvents: 'none'
                        }}
                      />
                    ))}

                    {/* Active Gantt Bar */}
                    <div
                      className={`timeline-bar ${metrics.isCritical ? 'critical' : 'standard'}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        zIndex: 2
                      }}
                      title={`${task.name}: Day ${startDay} to Day ${finishDay} (${formatDuration(duration)})`}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {metrics.isCritical ? `⚡ ${task.name}` : task.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
