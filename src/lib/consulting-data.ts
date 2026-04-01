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
  client_notes?: string;
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

// Función para agrupar fechas según el día de inicio de ciclo del cliente
export function getPeriodInfo(dateStr: string, startDay: number = 1) {
  if (!dateStr) return { id: "", label: "" };
  const [y, m, d] = dateStr.split('-').map(Number);

  let periodStartMonth = m - 1;
  let periodStartYear = y;

  if (d < startDay) {
    periodStartMonth -= 1;
    if (periodStartMonth < 0) {
      periodStartMonth = 11;
      periodStartYear -= 1;
    }
  }

  const id = `${periodStartYear}-${String(periodStartMonth + 1).padStart(2, '0')}`;

  if (startDay === 1) {
    const dateObj = new Date(periodStartYear, periodStartMonth, 1);
    const monthName = dateObj.toLocaleString('es-ES', { month: 'long' });
    return {
      id,
      label: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${periodStartYear}`
    };
  } else {
    const startDate = new Date(periodStartYear, periodStartMonth, startDay);
    const endDate = new Date(periodStartYear, periodStartMonth + 1, startDay - 1);

    const startMonthName = startDate.toLocaleString('es-ES', { month: 'short' });
    const endMonthName = endDate.toLocaleString('es-ES', { month: 'short' });

    return {
      id,
      label: `${startDay} ${startMonthName} - ${endDate.getDate()} ${endMonthName} ${endDate.getFullYear()}`
    };
  }
}