import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProject } from '../firebase/firestore';
import { ArrowLeft, FolderPlus, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { Input, TextArea } from '../components/Input';
import Card from '../components/Card';
import { useToast } from '../components/Toast';

export default function CreateProject() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }

    setLoading(true);
    try {
      const project = await createProject(currentUser.uid, {
        name: name.trim(),
        description: description.trim(),
        startDate
      });
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      addToast('Project created successfully!');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
          Create New Project
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Define your project scope and begin adding tasks and dependencies
        </p>
      </div>

      <Card>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            id="project-name"
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mobile App Redesign or Website Migration"
            required
            helpText="Give your project a descriptive title"
          />

          <TextArea
            id="project-description"
            label="Project Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of project goals, stakeholders, and deliverables..."
            rows={3}
          />

          <Input
            id="project-start-date"
            label="Project Start Date (Optional)"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            helpText="Used as baseline Day 0 for timeline calculations"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={FolderPlus}
            >
              Create Project
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
