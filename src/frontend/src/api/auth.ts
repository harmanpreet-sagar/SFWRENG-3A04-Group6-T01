import type { LoginResponse } from '../types';
import { apiClient } from './client';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/account/login', { email, password });
  return data;
}
