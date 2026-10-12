import api from './client.js';

export async function getDependencies(projectId) {
  return await api.get(`/api/dependencies/project/${projectId}`);
}

export async function createDependency(projectId, predecessorId, successorId) {
  return await api.post('/api/dependencies', { projectId, predecessorId, successorId });
}

export async function deleteDependency(dependencyId) {
  return await api.delete(`/api/dependencies/${dependencyId}`);
}
