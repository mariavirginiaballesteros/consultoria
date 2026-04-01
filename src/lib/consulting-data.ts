export type ActivityType = 'reunion' | 'trabajo' | 'reporte';

export interface ActivityRecord {
  id: string;
  client_id?: string;
  date: string;
  type: ActivityType;
  area: string;
  hours: number;
  impact: string;
  opportunity: boolean;
  notes: string;
  created_at?: string;
}

export const MONTHLY_BUDGET = 20;

export const TYPE_LABELS: Record<ActivityType, string> = {
  reunion: 'Reunión',
  trabajo: 'Trabajo / Análisis',
  reporte: 'Reporte'
};

export const AREAS = [
  'Comunicación Interna',
  'Procesos Estratégicos',
  'Transformación Digital',
  'Otros'
];

export const INITIAL_RECORDS: ActivityRecord[] = [];