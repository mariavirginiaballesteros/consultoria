import { Card, CardContent } from "@/components/ui/card";
import { ActivityRecord } from "@/lib/consulting-data";

interface MetricsCardsProps {
  records: ActivityRecord[]; // period records
  isClientView: boolean;
  monthlyHours: number;
  contractType: string;
  totalAccumulatedHours: number;
}

export function MetricsCards({ records, isClientView, monthlyHours, contractType, totalAccumulatedHours }: MetricsCardsProps) {
  const regularRecords = records.filter(r => !r.opportunity);
  
  const periodHours = regularRecords.reduce((sum, r) => sum + r.hours, 0);
  const monthlyExtraHours = monthlyHours > 0 ? Math.max(periodHours - monthlyHours, 0) : 0;
  
  const meetingHours = regularRecords.filter(r => r.type === 'reunion').reduce((sum, r) => sum + r.hours, 0);
  const meetingCount = regularRecords.filter(r => r.type === 'reunion').length;
  const opportunities = records.filter(r => r.opportunity).length;

  const isTotal = contractType === 'total';
  const isMonthly = contractType === 'monthly';
  const isServiceOnly = contractType === 'service';

  // For total contracts
  const totalRemaining = monthlyHours - totalAccumulatedHours;

  let gridClass = "grid gap-4 mb-8 ";
  if (isClientView) {
    gridClass += isServiceOnly ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3";
  } else {
    gridClass += isServiceOnly ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4";
  }

  return (
    <div className={gridClass}>
      {/* 1st Card: Month Activity */}
      <Card className="shadow-md border-slate-100 rounded-xl">
        <CardContent className="p-5">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">
            {isServiceOnly ? 'Actividades (mes)' : 'Horas consumidas (mes)'}
          </div>
          <div className="text-3xl font-black text-[#2A2B73]">
            {isServiceOnly ? regularRecords.length : `${periodHours}h`}
          </div>
          {!isClientView && !isServiceOnly && isMonthly && (
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              vs {monthlyHours}h presupuesto mensual
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2nd Card: Contract Status (Client View gets details, Admin also if Total) */}
      {(isClientView || isTotal) && (
         <Card className="shadow-md border-slate-100 rounded-xl">
           <CardContent className="p-5">
             <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">
               {isServiceOnly ? 'Modalidad' : (isTotal ? 'Consumo Global vs Contratado' : 'Horas contratadas por mes')}
             </div>
             {isTotal ? (
               <div className="flex items-baseline gap-2 mt-2">
                 <span className="text-3xl font-black text-[#62BAD3]">{totalAccumulatedHours}h</span>
                 <span className="text-sm font-bold text-slate-400">/ {monthlyHours}h</span>
               </div>
             ) : (
               <div className={`font-black leading-tight ${isServiceOnly ? 'text-xl mt-2 text-[#62BAD3]' : 'text-3xl text-[#62BAD3]'}`}>
                 {isServiceOnly ? 'Por Servicios' : `${monthlyHours}h`}
               </div>
             )}
           </CardContent>
         </Card>
      )}

      {/* 3rd Card: Extra / Available */}
      {!isServiceOnly && (
        <Card className={`shadow-md rounded-xl transition-colors ${isTotal ? (totalRemaining < 0 ? 'border-[#E32462] bg-[#E32462]/5' : 'border-[#D9E021] bg-[#D9E021]/5') : (monthlyExtraHours > 0 ? 'border-[#E32462] bg-[#E32462]/5' : 'border-slate-100')}`}>
          <CardContent className="p-5">
            <div className={`text-[11px] uppercase tracking-wider mb-2 font-bold ${isTotal ? (totalRemaining < 0 ? 'text-[#E32462]' : 'text-[#2A2B73]') : (monthlyExtraHours > 0 ? 'text-[#E32462]' : 'text-slate-500')}`}>
              {isTotal ? (totalRemaining < 0 ? 'Horas excedidas (Total)' : 'Horas disponibles totales') : (monthlyHours > 0 ? 'Horas extras facturables (Mes)' : 'Horas fuera de abono')}
            </div>
            <div className={`text-3xl font-black ${isTotal ? (totalRemaining < 0 ? 'text-[#E32462]' : 'text-[#2A2B73]') : (monthlyExtraHours > 0 ? 'text-[#E32462]' : 'text-[#2A2B73]')}`}>
              {isTotal ? `${Math.round(Math.abs(totalRemaining) * 10) / 10}h` : `${Math.round(monthlyExtraHours * 10) / 10}h`}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin specific Cards */}
      {!isClientView && (
        <>
          <Card className="shadow-md border-slate-100 rounded-xl">
            <CardContent className="p-5">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Reuniones (Mes)</div>
              <div className="text-3xl font-black text-[#62BAD3]">
                {isServiceOnly ? meetingCount : `${Math.round(meetingHours * 10) / 10}h`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                {isServiceOnly ? 'sesiones realizadas' : `${meetingCount} sesiones`}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-[#D9E021] bg-[#D9E021]/10 rounded-xl">
            <CardContent className="p-5">
              <div className="text-[11px] text-[#2A2B73] uppercase tracking-wider mb-2 font-bold">No cubierto</div>
              <div className="text-3xl font-black text-[#2A2B73]">{opportunities}</div>
              <div className="text-[11px] text-[#2A2B73]/70 mt-1 font-medium">oportunidades extra</div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}