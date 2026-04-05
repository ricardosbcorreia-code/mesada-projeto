/**
 * Shared TypeScript types for the Tarefa & Mesada API.
 * These match the Prisma schema models from the backend.
 */

export type UserRole = 'parent' | 'child';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  base_allowance: number;
  created_at: string;
}

export type TaskType = 'mandatory' | 'bonus' | 'penalty';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Task {
  id: string;
  parent_id: string;
  name: string;
  description?: string;
  type: TaskType;
  value: number;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_days: number[];
  recurrence_month?: number;
  created_at: string;
  assignments?: TaskAssignment[];
  subtasks?: SubTask[];
}

export interface SubTask {
  id: string;
  task_id: string;
  label: string;
  order: number;
}

export interface SubTaskCompletion {
  id: string;
  subtask_id: string;
  execution_id: string;
  checked: boolean;
  checked_at?: string;
}

export type ExecutionStatus = 'pending' | 'completed' | 'approved' | 'rejected';

export interface TaskAssignment {
  id: string;
  task_id: string;
  child_id: string;
  active: boolean;
  task?: Task;
  child?: Child;
  executions?: TaskExecution[];
}

export interface TaskExecution {
  id: string;
  assignment_id: string;
  date: string;
  status: ExecutionStatus;
  assignment?: TaskAssignment;
  subtask_completions?: SubTaskCompletion[];
}

export type RedemptionStatus = 'pending' | 'approved' | 'rejected';

export interface Reward {
  id: string;
  parent_id: string;
  name: string;
  description?: string;
  cost_in_xp: number;
  max_redeems?: number;
  created_at: string;
  redemptions?: RewardRedemption[];
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  child_id: string;
  cost: number;
  status: RedemptionStatus;
  created_at: string;
  reward?: Reward;
  child?: { name: string };
}

export interface MonthlyReport {
  childId: string;
  childName: string;
  month: number;
  year: number;
  baseAllowance: number;
  earnedXP: number;
  bonuses: number;
  penalties: number;
  finalAllowance: number;
  history?: HistoryReport[];
}

export interface HistoryReport {
  month: number;
  year: number;
  earnedXP: number;
  bonuses: number;
  penalties: number;
  finalAllowance: number;
}
