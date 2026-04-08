import { Card, CardContent } from "@/components/ui/card";
import { ActivityRecord } from "@/lib/consulting-data";

interface MetricsCardsProps {
  records: ActivityRecord[];
  isClientView: boolean;
  monthlyHours: number;
}

export function MetricsCards({ records, isClientView, monthlyHours }: MetricsCardsProps) {
  const regularRecords = records.filter(r => !r.opportunity);
  
  const totalHours = regularRecords.reduce((sum, r) => sum + r.hours, 0);
  const extraHours = monthlyHours > 0 ? Math.max(totalHours - monthlyHours, 0) : 0;
  const meetingHours = regularRecords.filter(r => r.type === 'reunion').reduce((sum, r) => sum + r.hours, 0);
  const meetingCount = regularRecords.filter(r => r.type === 'reunion').length;
  const opportunities = records.filter(r => r.opportunity).length;

  const isServiceOnly = monthlyHours === 0;

  let gridClass = "grid gap-4 mb-8 ";
  if (isClientView) {
    gridClass += isServiceOnly ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3";
  } else {
    gridClass += isServiceOnly ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4";
  }

  return (
    <div className={gridClass}>
      <Card className="shadow-md border-slate-100 rounded-xl">
        <CardContent className="p-5">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">
            {isServiceOnly ? 'Actividades realizadas' : (isClientView ? 'Horas registradas' : 'Total horas')}
          </div>
          <div className="text-3xl font-black text-[#2A2B73]">
            {isServiceOnly ? regularRecords.length : `${totalHours}h`}
          </div>
          {!isClientView && !isServiceOnly && (
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              vs {monthlyHours}h presupuesto
            </div>
          )}
        </CardContent>
      </Card>

      {isClientView && (
         <Card className="shadow-md border-slate-100 rounded-xl">
           <CardContent className="p-5">
             <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">
               {isServiceOnly ? 'Modalidad' : 'Horas contratadas'}
             </div>
             <div className={`font-black leading-tight ${isServiceOnly ? 'text-xl mt-2 text-[#62BAD3]' : 'text-3xl text-[#62BAD3]'}`}>
               {isServiceOnly ? 'Por Servicios' : `${monthlyHours}h`}
             </div>
           </CardContent>
         </Card>
      )}

      {!isServiceOnly && (
        <Card className={`shadow-md rounded-xl transition-colors ${extraHours > 0 ? 'border-[#E32462] bg-[#E32462]/5' : 'border-slate-100'}`}>
          <CardContent className="p-5">
            <div className={`text-[11px] uppercase tracking-wider mb-2 font-bold ${extraHours > 0 ? 'text-[#E32462]' : 'text-slate-500'}`}>
              {monthlyHours > 0 ? 'Horas extras facturables' : 'Horas fuera de abono'}
            </div>
            <div className={`text-3xl font-black ${extraHours > 0 ? 'text-[#E32462]' : 'text-[#2A2B73]'}`}>
              {Math.round(extraHours * 10) / 10}h
            </div>
          </CardContent>
        </Card>
      )}

      {!isClientView && (
        <>
          <Card className="shadow-md border-slate-100 rounded-xl">
            <CardContent className="p-5">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Reuniones</div>
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