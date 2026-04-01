import { Card, CardContent } from "@/components/ui/card";
import { ActivityRecord, MONTHLY_BUDGET } from "@/lib/consulting-data";

interface MetricsCardsProps {
  records: ActivityRecord[];
  isClientView: boolean;
}

export function MetricsCards({ records, isClientView }: MetricsCardsProps) {
  const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
  const extraHours = Math.max(totalHours - MONTHLY_BUDGET, 0);
  const meetingHours = records.filter(r => r.type === 'reunion').reduce((sum, r) => sum + r.hours, 0);
  const meetingCount = records.filter(r => r.type === 'reunion').length;
  const opportunities = records.filter(r => r.opportunity).length;

  return (
    <div className={`grid gap-4 mb-8 ${isClientView ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
      <Card className="shadow-md border-slate-100 rounded-xl">
        <CardContent className="p-5">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">
            {isClientView ? 'Horas consumidas' : 'Total horas'}
          </div>
          <div className="text-3xl font-black text-[#2A2B73]">{totalHours}h</div>
          {!isClientView && (
            <div className="text-[11px] text-slate-400 mt-1 font-medium">vs {MONTHLY_BUDGET}h presupuesto</div>
          )}
        </CardContent>
      </Card>

      {isClientView && (
         <Card className="shadow-md border-slate-100 rounded-xl">
           <CardContent className="p-5">
             <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Horas contratadas</div>
             <div className="text-3xl font-black text-[#62BAD3]">{MONTHLY_BUDGET}h</div>
           </CardContent>
         </Card>
      )}

      <Card className={`shadow-md rounded-xl transition-colors ${extraHours > 0 ? 'border-[#E32462] bg-[#E32462]/5' : 'border-slate-100'}`}>
        <CardContent className="p-5">
          <div className={`text-[11px] uppercase tracking-wider mb-2 font-bold ${extraHours > 0 ? 'text-[#E32462]' : 'text-slate-500'}`}>
            Horas extras facturables
          </div>
          <div className={`text-3xl font-black ${extraHours > 0 ? 'text-[#E32462]' : 'text-[#2A2B73]'}`}>
            {Math.round(extraHours * 10) / 10}h
          </div>
        </CardContent>
      </Card>

      {!isClientView && (
        <>
          <Card className="shadow-md border-slate-100 rounded-xl">
            <CardContent className="p-5">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Reuniones</div>
              <div className="text-3xl font-black text-[#62BAD3]">{Math.round(meetingHours * 10) / 10}h</div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">{meetingCount} sesiones</div>
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