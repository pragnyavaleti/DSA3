import api from './client.js';

export async function getProjectSchedule(projectId) {
  return await api.get(`/api/dsa/project/${projectId}/schedule`);
}

export async function getProjectGraph(projectId) {
  return await api.get(`/api/dsa/project/${projectId}/graph`);
}

export async function getCycleCheck(projectId) {
  return await api.get(`/api/dsa/project/${projectId}/cycle-check`);
}

export async function getCriticalPath(projectId) {
  return await api.get(`/api/dsa/project/${projectId}/critical-path`);
}
