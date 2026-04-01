import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ActivityRecord, MONTHLY_BUDGET, TYPE_LABELS } from "@/lib/consulting-data";
import { Users, Zap, FileText } from "lucide-react";

export function ClientOverview({ records }: { records: ActivityRecord[] }) {
  const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
  const percentage = Math.min((totalHours / MONTHLY_BUDGET) * 100, 100);
  const isOverBudget = totalHours > MONTHLY_BUDGET;

  const areas = records.reduce((acc, r) => {
    acc[r.area] = (acc[r.area] || 0) + r.hours;
    return acc;
  }, {} as Record<string, number>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reunion': return <Users className="h-5 w-5 text-[#62BAD3]" />;
      case 'trabajo': return <Zap className="h-5 w-5 text-[#D9E021]" />;
      case 'reporte': return <FileText className="h-5 w-5 text-[#E32462]" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-slate-100 rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-sm font-bold mb-3 text-[#2A2B73] uppercase tracking-wide">Consumo mensual</h2>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-500 font-medium">Progreso</span>
            <span className="font-bold text-[#2A2B73]">{totalHours}/{MONTHLY_BUDGET}h ({Math.round(percentage)}%)</span>
          </div>
          <Progress 
            value={percentage} 
            className={`h-3 bg-[#2A2B73]/10 ${isOverBudget ? '[&>div]:bg-[#E32462]' : '[&>div]:bg-[#D9E021]'}`} 
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-slate-100 rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold mb-4 text-[#2A2B73] uppercase tracking-wide">Inversión por área</h2>
            <div className="space-y-3">
              {Object.entries(areas).map(([area, hours]) => (
                <div key={area} className="flex justify-between items-center py-2 border-b last:border-0 border-slate-100 text-sm">
                  <span className="text-slate-600 font-medium">{area}</span>
                  <strong className="text-[#2A2B73] bg-[#62BAD3]/10 px-3 py-1 rounded-full">{Math.round(hours * 10) / 10}h</strong>
                </div>
              ))}
              {Object.keys(areas).length === 0 && <div className="text-sm text-slate-400 py-2">Sin datos registrados</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-100 rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold mb-4 text-[#2A2B73] uppercase tracking-wide">Detalle de actividades</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {records.map(r => (
                <div key={r.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white rounded-md shadow-sm">
                        {getTypeIcon(r.type)}
                      </div>
                      <strong className="text-sm text-[#2A2B73]">{TYPE_LABELS[r.type]}</strong>
                    </div>
                    <span className="text-sm font-bold text-[#2A2B73]">{r.hours}h</span>
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed">{r.impact}</div>
                </div>
              ))}
              {records.length === 0 && <div className="text-sm text-slate-400 py-2">Sin datos registrados</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}