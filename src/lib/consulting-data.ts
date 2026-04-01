export interface ActivityRecord {
  id: string;
  client_id?: string;
  date: string;
  type: string;
  area: string;
  hours: number;
  impact: string;
  opportunity: boolean;
  notes: string;
  created_at?: string;
}

export const MONTHLY_BUDGET = 20;

export const DEFAULT_TYPES = [
  { value: 'reunion', label: 'Reunión' },
  { value: 'trabajo', label: 'Trabajo / Análisis' },
  { value: 'reporte', label: 'Reporte' }
];

export const AREAS = [
  'Comunicación Interna',
  'Procesos Estratégicos',
  'Transformación Digital',
  'Otros'
];

export const INITIAL_RECORDS: ActivityRecord[] = [];