import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ActivityRecord, MONTHLY_BUDGET, TYPE_LABELS } from "@/lib/consulting-data";

export function ClientOverview({ records }: { records: ActivityRecord[] }) {
  const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
  const percentage = Math.min((totalHours / MONTHLY_BUDGET) * 100, 100);
  const isOverBudget = totalHours > MONTHLY_BUDGET;

  const areas = records.reduce((acc, r) => {
    acc[r.area] = (acc[r.area] || 0) + r.hours;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold mb-3 text-slate-900">Consumo mensual</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-semibold text-slate-900">{totalHours}/{MONTHLY_BUDGET}h ({Math.round(percentage)}%)</span>
          </div>
          <Progress 
            value={percentage} 
            className={`h-2.5 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-[#3b6d11]'}`} 
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold mb-3 text-slate-900">Dónde se invirtieron las horas</h2>
          <div className="space-y-2">
            {Object.entries(areas).map(([area, hours]) => (
              <div key={area} className="flex justify-between items-center py-2 border-b last:border-0 border-slate-100 text-sm">
                <span className="text-slate-600">{area}</span>
                <strong className="text-slate-900">{Math.round(hours * 10) / 10}h</strong>
              </div>
            ))}
            {Object.keys(areas).length === 0 && <div className="text-sm text-muted-foreground py-2">Sin datos</div>}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold mb-3 text-slate-900">Detalle de actividades</h2>
          <div className="space-y-0 max-h-[400px] overflow-y-auto pr-2">
            {records.map(r => (
              <div key={r.id} className="py-3 border-b last:border-0 border-slate-100">
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-sm text-slate-900">{TYPE_LABELS[r.type]}</strong>
                  <span className="text-sm font-semibold text-blue-600">{r.hours}h</span>
                </div>
                <div className="text-sm text-slate-600">{r.impact}</div>
              </div>
            ))}
            {records.length === 0 && <div className="text-sm text-muted-foreground py-2">Sin datos</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}