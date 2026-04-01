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
    date: '2026-03-16',
    type: 'reunion',
    area: 'Comunicación Interna',
    hours: 1,
    impact: 'Diagnóstico',
    opportunity: false,
    notes: ''
  },
  {
    id: 2,
    date: '2026-03-25',
    type: 'reunion',
    area: 'Comunicación Interna',
    hours: 1.5,
    impact: 'Revisión de estrategia y consultoría general',
    opportunity: false,
    notes: ''
  },
  {
    id: 3,
    date: '2026-03-30',
    type: 'reunion',
    area: 'Procesos Estratégicos',
    hours: 1,
    impact: 'avances de procesos+cosnultoria',
    opportunity: false,
    notes: ''
  },
  {
    id: 4,
    date: '2026-03-24',
    type: 'trabajo',
    area: 'Procesos Estratégicos',
    hours: 4,
    impact: 'Esqueleto plan com interna',
    opportunity: false,
    notes: ''
  },
  {
    id: 5,
    date: '2026-03-19',
    type: 'trabajo',
    area: 'Procesos Estratégicos',
    hours: 5,
    impact: 'Esqueleto implementación nuevo modelo CI',
    opportunity: false,
    notes: ''
  },
  {
    id: 6,
    date: '2026-03-31',
    type: 'reporte',
    area: 'Procesos Estratégicos',
    hours: 2,
    impact: 'Borrador análisis de herramientas',
    opportunity: false,
    notes: ''
  },
  {
    id: 7,
    date: '2026-03-25',
    type: 'trabajo',
    area: 'Procesos Estratégicos',
    hours: 2.5,
    impact: 'Revision de moderación actual LKD y gener...',
    opportunity: false,
    notes: ''
  }
];