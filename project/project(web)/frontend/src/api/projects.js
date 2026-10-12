import api from './client.js';

export async function getProjects() {
  return await api.get('/api/projects');
}

export async function getProject(projectId) {
  return await api.get(`/api/projects/${projectId}`);
}

export async function createProject(projectData) {
  return await api.post('/api/projects', projectData);
}

export async function updateProject(projectId, updateData) {
  return await api.put(`/api/projects/${projectId}`, updateData);
}

export async function deleteProject(projectId) {
  return await api.delete(`/api/projects/${projectId}`);
}

export async function loadSampleProject() {
  return await api.post('/api/projects/sample');
}
