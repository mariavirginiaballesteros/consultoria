export type ActivityType = 'reunion' | 'trabajo' | 'reporte';

export interface ActivityRecord {
  id: number;
  date: string;
  type: ActivityType;
  area: string;
  hours: number;
  impact: string;
  opportunity: boolean;
  notes: string;
}

export const MONTHLY_BUDGET = 20;

export const TYPE_LABELS: Record<ActivityType, string> = {
  reunion: '👥 Reunión',
  trabajo: '📋 Trabajo/Análisis',
  reporte: '📊 Reporte'
};

export const AREAS = [
  'Comunicación Interna',
  'Procesos Estratégicos',
  'Transformación Digital',
  'Otros'
];

export const INITIAL_RECORDS: ActivityRecord[] = [
  {
    id: 1,
    date: '2025-03-15',
    type: 'reunion',
    area: 'Comunicación Interna',
    hours: 3,
    impact: 'Alineamiento estratégico con stakeholders',
    opportunity: false,
    notes: 'Reunión de kickoff - procesos'
  },
  {
    id: 2,
    date: '2025-03-16',
    type: 'trabajo',
    area: 'Procesos Estratégicos',
    hours: 4,
    impact: 'Diagnóstico de gaps en comunicación',
    opportunity: false,
    notes: 'Análisis de situación actual'
  }
];