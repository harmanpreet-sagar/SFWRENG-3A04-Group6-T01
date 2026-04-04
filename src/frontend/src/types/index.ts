export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Condition = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
export type Clearance = 'admin' | 'operator';

export interface Threshold {
  id: number;
  zone: string;
  metric: string;
  condition: Condition;
  threshold_value: number;
  severity: Severity;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThresholdCreate {
  zone: string;
  metric: string;
  condition: Condition;
  threshold_value: number;
  severity: Severity;
  is_active: boolean;
}

export interface ThresholdUpdate {
  zone?: string;
  metric?: string;
  condition?: Condition;
  threshold_value?: number;
  severity?: Severity;
}

export interface Account {
  aid: number;
  name: string;
  email: string;
  clearance: Clearance;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  message: string;
  identity_verified: boolean;
  account: Account;
  access_token?: string;
  token_type?: string;
}

export const KNOWN_ZONES = ['zone-a', 'zone-b', 'zone-c', 'zone-d'] as const;
export const KNOWN_METRICS = ['aqi', 'temperature', 'humidity', 'noise'] as const;
export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'gt',  label: '> (greater than)' },
  { value: 'gte', label: '>= (greater than or equal)' },
  { value: 'lt',  label: '< (less than)' },
  { value: 'lte', label: '<= (less than or equal)' },
  { value: 'eq',  label: '= (equal to)' },
];
export const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
