import React from 'react';
import { NavLink, useParams, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  GitBranch,
  Play,
  Zap,
  Calendar,
  ArrowLeft,
  ChevronRight,
  Check
} from 'lucide-react';

export default function ProjectStepsNav({ project }) {
  const { id } = useParams();
  const projectId = id || project?.id;
  const location = useLocation();

  const steps = [
    { name: 'Overview', path: `/projects/${projectId}`, icon: LayoutDashboard, stepNum: '1' },
    { name: 'Tasks', path: `/projects/${projectId}/tasks`, icon: CheckSquare, stepNum: '2' },
    { name: 'Dependencies', path: `/projects/${projectId}/dependencies`, icon: GitBranch, stepNum: '3' },
    { name: 'Schedule', path: `/projects/${projectId}/schedule`, icon: Play, stepNum: '4' },
    { name: 'Critical Path', path: `/projects/${projectId}/critical-path`, icon: Zap, stepNum: '5' },
    { name: 'Timeline', path: `/projects/${projectId}/timeline`, icon: Calendar, stepNum: '6' }
  ];

  // Determine active step index
  const currentPath = location.pathname;
  const activeIndex = steps.findIndex(step => {
    if (step.path === `/projects/${projectId}`) {
      return currentPath === step.path || currentPath === `${step.path}/`;
    }
    return currentPath.startsWith(step.path);
  });

  return (
    <div className="project-nav-wrapper">
      {/* Top Breadcrumb Bar */}
      <div className="project-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/dashboard"
            className="btn btn-secondary btn-sm nav-back-btn"
            style={{ padding: '0.35rem 0.6rem' }}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="project-breadcrumbs">
            <Link to="/dashboard" className="crumb-link">Projects</Link>
            <span className="crumb-separator">/</span>
            <span className="active crumb-current">{project?.name || 'Project'}</span>
          </div>
        </div>
        {project?.startDate && (
          <div className="project-start-badge">
            <span style={{ color: 'var(--text-muted)' }}>Start Date:</span>{' '}
            <strong style={{ color: 'var(--text-main)' }}>{project.startDate}</strong>
          </div>
        )}
      </div>

      {/* Steps Tab Bar with Directional Chevrons & Hover Glow */}
      <nav className="step-nav-bar" aria-label="Project workflow steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = index === activeIndex;
          const isCompleted = activeIndex > index && activeIndex !== -1;

          return (
            <React.Fragment key={step.name}>
              <NavLink
                to={step.path}
                end={step.path === `/projects/${projectId}`}
                className={({ isActive }) => 
                  `step-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`
                }
              >
                <span className="step-badge">
                  {isCompleted ? (
                    <Check size={12} strokeWidth={3} className="step-check-icon" />
                  ) : (
                    step.stepNum
                  )}
                </span>
                <span className="step-icon-wrap">
                  <Icon size={16} className="step-icon" />
                </span>
                <span className="step-label">{step.name}</span>
                {isCurrent && <span className="step-active-dot" />}
              </NavLink>

              {index < steps.length - 1 && (
                <div 
                  className={`step-separator ${isCompleted ? 'completed-separator' : ''}`} 
                  aria-hidden="true"
                >
                  <ChevronRight size={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
