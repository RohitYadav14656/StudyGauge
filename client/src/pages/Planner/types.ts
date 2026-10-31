export type PlanStatus = 'pending' | 'partially_complete' | 'completed' | 'cancelled';
export type PlanPriority = 'low' | 'medium' | 'high';

export interface PlanItemType {
  id: string;
  topic: string;
  subject: string;
  priority: PlanPriority;
  status: PlanStatus;
  plannedDuration: number;
  actualDuration: number;
  date: string;
}
