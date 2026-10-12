import api from './client.js';

export async function getTasks(projectId) {
  return await api.get(`/api/tasks/project/${projectId}`);
}

export async function createTask(projectId, taskData) {
  return await api.post('/api/tasks', { projectId, ...taskData });
}

export async function updateTask(taskId, updateData) {
  return await api.put(`/api/tasks/${taskId}`, updateData);
}

export async function deleteTask(taskId) {
  return await api.delete(`/api/tasks/${taskId}`);
}
