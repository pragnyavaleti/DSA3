import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getProject,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getDependencies
} from '../firebase/firestore';
import {
  Plus,
  ArrowRight,
  Layers,
  Edit2,
  Trash2,
  Clock,
  AlertCircle
} from 'lucide-react';
import ProjectStepsNav from '../components/ProjectStepsNav';
import Button from '../components/Button';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';
import { Input, TextArea, Select } from '../components/Input';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export default function Tasks() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('3');
  const [status, setStatus] = useState('Pending');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getProject(id);
      setProject(p);

      const t = await getTasks(id);
      setTasks(t);

      const d = await getDependencies(id);
      setDependencies(d);
    } catch (err) {
      console.error('Error fetching tasks', err);
      addToast('Error fetching tasks: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const openAddModal = () => {
    setEditingTask(null);
    setName('');
    setDescription('');
    setDuration('3');
    setStatus('Pending');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setName(task.name);
    setDescription(task.description || '');
    setDuration(String(task.duration || 1));
    setStatus(task.status || 'Pending');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a task name.');
      return;
    }

    const durNum = parseInt(duration, 10);
    if (isNaN(durNum) || durNum <= 0) {
      setFormError('Task duration must be greater than 0.');
      return;
    }

    setSaving(true);
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, {
          name: name.trim(),
          description: description.trim(),
          duration: durNum,
          status
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t))
        );
        window.dispatchEvent(new CustomEvent('dsa-project-updated'));
        addToast(`Task "${name}" updated successfully`);
      } else {
        const created = await createTask(id, {
          name: name.trim(),
          description: description.trim(),
          duration: durNum,
          status
        });
        setTasks((prev) => [...prev, created]);
        window.dispatchEvent(new CustomEvent('dsa-project-updated'));
        addToast(`Task "${name}" added`);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...updated, status: newStatus } : t))
      );
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      addToast(`Task "${task.name}" moved to ${newStatus}`);
    } catch (err) {
      addToast('Failed to update task status: ' + err.message, 'error');
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete.id, id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setDependencies((prev) =>
        prev.filter(
          (d) =>
            d.predecessorId !== taskToDelete.id &&
            d.successorId !== taskToDelete.id
        )
      );
      window.dispatchEvent(new CustomEvent('dsa-project-updated'));
      addToast(`Task "${taskToDelete.name}" deleted`);
      setTaskToDelete(null);
    } catch (err) {
      addToast('Failed to delete task: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };


  if (loading) {
    return <LoadingSpinner fullPage text="Loading tasks..." />;
  }

  if (!project) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ color: 'var(--primary-navy)', fontFamily: 'var(--font-heading)' }}>Project not found or access denied</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>The requested project does not exist or you do not have permission to access it.</p>
        <Link to="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Map each task to its predecessor names
  const taskMap = new Map();
  tasks.forEach((t) => taskMap.set(t.id, t));

  const predecessorsMap = new Map();
  tasks.forEach((t) => predecessorsMap.set(t.id, []));

  dependencies.forEach((d) => {
    if (predecessorsMap.has(d.successorId) && taskMap.has(d.predecessorId)) {
      predecessorsMap
        .get(d.successorId)
        .push(taskMap.get(d.predecessorId).name);
    }
  });

  return (
    <div>
      <ProjectStepsNav project={project} />

      <div className="page-container">
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-blue)', fontWeight: 700 }}>
              Step 2 of 6
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              Project Tasks
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Add all tasks required for this project and assign estimated durations in days.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="primary" icon={Plus} onClick={openAddModal}>
              + Add Task
            </Button>
            {tasks.length > 0 && (
              <Link to={`/projects/${id}/dependencies`}>
                <Button variant="navy" icon={ArrowRight}>
                  Next: Dependencies
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Task Grid */}
        {loading ? (
          <LoadingSpinner fullPage={false} text="Loading tasks..." />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No tasks added yet."
            description="Add your first task to start building your project graph and timeline."
            actionText="+ Add First Task"
            onAction={openAddModal}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                predecessors={predecessorsMap.get(task.id) || []}
                onEdit={openEditModal}
                onDelete={() => setTaskToDelete(task)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Task Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTask ? 'Edit Task' : 'Add New Task'}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveTask}
                loading={saving}
              >
                {editingTask ? 'Save Changes' : 'Add Task'}
              </Button>
            </>
          }
        >
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{formError}</div>
            </div>
          )}

          <form onSubmit={handleSaveTask}>
            <Input
              id="task-name"
              label="Task Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Requirement Analysis, UI Design, Unit Testing"
              required
            />

            <TextArea
              id="task-desc"
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or notes on what this task entails..."
              rows={2}
            />

            <Input
              id="task-duration"
              label="Duration (in Days)"
              type="number"
              min="1"
              max="999"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              helpText="Expected completion time in days (must be > 0)"
            />

            <Select
              id="task-status"
              label="Execution Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' }
              ]}
            />
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={Boolean(taskToDelete)}
          onClose={() => setTaskToDelete(null)}
          onConfirm={confirmDeleteTask}
          title="Delete Task?"
          message={`Are you sure you want to delete "${taskToDelete?.name}"? Any dependencies linking to or from this task will also be deleted.`}
          confirmText="Delete Task"
          loading={isDeleting}
        />
      </div>
    </div>
  );
}
