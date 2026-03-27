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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">
            {isClientView ? 'Horas consumidas' : 'Total horas'}
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalHours}h</div>
          {!isClientView && (
            <div className="text-[11px] text-muted-foreground mt-1">vs {MONTHLY_BUDGET}h presupuesto</div>
          )}
        </CardContent>
      </Card>

      {isClientView && (
         <Card className="shadow-sm">
           <CardContent className="p-4">
             <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">Horas disponibles</div>
             <div className="text-2xl font-bold text-slate-900">{MONTHLY_BUDGET}h</div>
           </CardContent>
         </Card>
      )}

      {extraHours > 0 && (
        <Card className="shadow-sm border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="text-[11px] text-red-600 uppercase tracking-wider mb-2 font-medium">Horas extras</div>
            <div className="text-2xl font-bold text-red-600">{Math.round(extraHours * 10) / 10}h</div>
            {!isClientView && (
              <div className="text-[11px] text-red-500/80 mt-1">para facturación</div>
            )}
          </CardContent>
        </Card>
      )}

      {!isClientView && (
        <>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">Reuniones</div>
              <div className="text-2xl font-bold text-slate-900">{Math.round(meetingHours * 10) / 10}h</div>
              <div className="text-[11px] text-muted-foreground mt-1">{meetingCount} sesiones</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-amber-200 bg-amber-50/30">
            <CardContent className="p-4">
              <div className="text-[11px] text-amber-700 uppercase tracking-wider mb-2 font-medium">No cubierto</div>
              <div className="text-2xl font-bold text-amber-600">{opportunities}</div>
              <div className="text-[11px] text-amber-600/80 mt-1">oportunidades</div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}