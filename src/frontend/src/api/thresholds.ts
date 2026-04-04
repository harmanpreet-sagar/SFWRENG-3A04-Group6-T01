import type { Threshold, ThresholdCreate, ThresholdUpdate } from '../types';
import { apiClient } from './client';

export async function listThresholds(): Promise<Threshold[]> {
  const { data } = await apiClient.get<Threshold[]>('/threshold');
  return data;
}

export async function getThreshold(id: number): Promise<Threshold> {
  const { data } = await apiClient.get<Threshold>(`/threshold/${id}`);
  return data;
}

export async function createThreshold(payload: ThresholdCreate): Promise<Threshold> {
  const { data } = await apiClient.post<Threshold>('/threshold', payload);
  return data;
}

export async function updateThreshold(id: number, changes: ThresholdUpdate): Promise<Threshold> {
  const { data } = await apiClient.patch<Threshold>(`/threshold/${id}`, changes);
  return data;
}

export async function activateThreshold(id: number): Promise<Threshold> {
  const { data } = await apiClient.patch<Threshold>(`/threshold/${id}/activate`);
  return data;
}

export async function deactivateThreshold(id: number): Promise<Threshold> {
  const { data } = await apiClient.patch<Threshold>(`/threshold/${id}/deactivate`);
  return data;
}

export async function deleteThreshold(id: number): Promise<void> {
  await apiClient.delete(`/threshold/${id}`);
}
