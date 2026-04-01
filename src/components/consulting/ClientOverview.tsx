import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ActivityRecord, formatDate } from "@/lib/consulting-data";
import { Users, Zap, FileText, CheckCircle2, MessageSquare, Calendar, FolderTree, Clock } from "lucide-react";

interface ClientOverviewProps {
  records: ActivityRecord[];
  monthlyHours: number;
  typeLabels: Record<string, string>;
  onUpdateClientNote: (id: string, note: string) => void;
}

export function ClientOverview({ records, monthlyHours, typeLabels, onUpdateClientNote }: ClientOverviewProps) {
  // Filtramos para NO mostrar las oportunidades en este listado (van abajo en su propia caja)
  const regularRecords = records.filter(r => !r.opportunity);
  
  const totalHours = regularRecords.reduce((sum, r) => sum + r.hours, 0);
  const percentage = Math.min((totalHours / monthlyHours) * 100, 100);
  const isOverBudget = totalHours > monthlyHours;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reunion': return <Users className="h-5 w-5 text-[#62BAD3]" />;
      case 'trabajo': return <Zap className="h-5 w-5 text-[#D9E021]" />;
      case 'reporte': return <FileText className="h-5 w-5 text-[#E32462]" />;
      default: return <CheckCircle2 className="h-5 w-5 text-[#D9E021]" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-slate-100 rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-sm font-bold mb-3 text-[#2A2B73] uppercase tracking-wide">Consumo mensual</h2>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-500 font-medium">Progreso</span>
            <span className="font-bold text-[#2A2B73]">{totalHours}/{monthlyHours}h ({Math.round(percentage)}%)</span>
          </div>
          <Progress 
            value={percentage} 
            className={`h-3 bg-[#2A2B73]/10 ${isOverBudget ? '[&>div]:bg-[#E32462]' : '[&>div]:bg-[#D9E021]'}`} 
          />
        </CardContent>
      </Card>

      <Card className="shadow-md border-slate-100 rounded-xl">
        <CardContent className="p-6">
          <h2 className="text-sm font-bold mb-6 text-[#2A2B73] uppercase tracking-wide">Detalle completo de actividades</h2>
          <div id="activity-list-container" className="space-y-5">
            {regularRecords.map(r => (
              <div key={r.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
                
                {/* Cabecera */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md whitespace-nowrap">
                      <Calendar className="h-4 w-4 mr-1.5" /> {formatDate(r.date)}
                    </span>
                    <span className="flex items-center text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                      <FolderTree className="h-4 w-4 mr-1.5" /> {r.area}
                    </span>
                    <div className="flex items-center gap-1.5 text-sm text-[#2A2B73] font-bold bg-[#62BAD3]/10 px-3 py-1 rounded-md">
                      {getTypeIcon(r.type)} {typeLabels[r.type] || r.type}
                    </div>
                  </div>
                  <span className="flex items-center text-xl font-black text-[#2A2B73] bg-[#D9E021]/20 px-4 py-1 rounded-lg">
                    <Clock className="h-5 w-5 mr-1.5 text-[#2A2B73]" />
                    {r.hours}h
                  </span>
                </div>

                {/* Contenido admin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-1.5">Impacto / Entregable</h4>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{r.impact}</p>
                  </div>
                  {r.notes && (
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-400 mb-1.5">Notas adicionales</h4>
                      <p className="text-sm text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">{r.notes}</p>
                    </div>
                  )}
                </div>

                {/* Observaciones cliente */}
                <div className="mt-2 pt-4 border-t border-slate-100" data-html2canvas-ignore>
                  <h4 className="text-xs font-bold uppercase text-[#62BAD3] mb-2.5 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" /> Tus observaciones
                  </h4>
                  <Textarea
                    defaultValue={r.client_notes || ''}
                    placeholder="Escribe tus comentarios, dudas o feedback sobre esta actividad y haz clic fuera de la caja para guardar..."
                    className="text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:border-[#62BAD3] min-h-[60px] resize-y"
                    onBlur={(e) => {
                      if (e.target.value !== (r.client_notes || '')) {
                        onUpdateClientNote(r.id, e.target.value);
                      }
                    }}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Los cambios se guardan automáticamente al quitar el cursor de la caja.</span>
                </div>
                
                {/* Notas cliente visibles en PDF */}
                {r.client_notes && (
                  <div className="hidden mt-2 pt-3 border-t border-slate-100" data-html2canvas-show style={{ display: 'none' }}>
                    <h4 className="text-xs font-bold uppercase text-[#62BAD3] mb-1.5">Observaciones del cliente</h4>
                    <p className="text-sm text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">{r.client_notes}</p>
                  </div>
                )}
              </div>
            ))}
            {regularRecords.length === 0 && <div className="text-center text-slate-400 py-10 bg-white rounded-xl border border-slate-200">No hay actividades registradas en este periodo.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}