import { useState } from "react";
import { Download, AlertCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INITIAL_RECORDS, ActivityRecord, TYPE_LABELS } from "@/lib/consulting-data";
import { MetricsCards } from "@/components/consulting/MetricsCards";
import { AdminForm } from "@/components/consulting/AdminForm";
import { AdminTable } from "@/components/consulting/AdminTable";
import { ClientOverview } from "@/components/consulting/ClientOverview";
import { showSuccess } from "@/utils/toast";

export default function Index() {
  const [view, setView] = useState<'admin' | 'cliente'>('admin');
  const [records, setRecords] = useState<ActivityRecord[]>(INITIAL_RECORDS);
  const [clientName, setClientName] = useState("Consultoría Bancaria");
  const [isEditingName, setIsEditingName] = useState(false);

  const handleAddRecord = (data: Omit<ActivityRecord, 'id'>) => {
    const newRecord: ActivityRecord = {
      ...data,
      id: records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1,
    };
    setRecords([...records, newRecord]);
  };

  const handleDeleteRecord = (id: number) => {
    setRecords(records.filter(r => r.id !== id));
    showSuccess("Actividad eliminada");
  };

  const handleExportCSV = () => {
    const rows = [['Fecha', 'Tipo', 'Área', 'Horas', 'Impacto', 'Oportunidad No Cubierta', 'Notas']];
    records.forEach(r => {
      rows.push([
        r.date, TYPE_LABELS[r.type] || r.type, r.area, r.hours.toString(),
        r.impact, r.opportunity ? 'Sí' : 'No', r.notes
      ]);
    });
    const csvContent = rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-${clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const opportunities = records.filter(r => r.opportunity);
  
  // Format current month and year nicely (e.g., "Marzo 2025")
  const dateStr = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 pb-12 font-sans selection:bg-blue-200">
      <div className="max-w-[1200px] mx-auto px-4 pt-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 md:p-6 rounded-lg shadow-sm border border-slate-200 mb-8 gap-4 transition-all">
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xl md:text-2xl font-semibold text-blue-600">🏦</span>
            {isEditingName ? (
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                className="text-lg md:text-xl font-semibold text-blue-600 h-9 w-[200px] md:w-[250px] border-blue-200 focus-visible:ring-blue-500 px-2"
                autoFocus
              />
            ) : (
              <h1 
                className="text-xl md:text-2xl font-semibold text-blue-600 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group"
                onClick={() => setIsEditingName(true)}
                title="Click para editar nombre"
              >
                {clientName}
                <Pencil className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </h1>
            )}
            <span className="text-xl md:text-2xl font-semibold text-blue-600 hidden md:inline-block">- {formattedDate}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setView('admin')}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm rounded-sm font-medium transition-all ${view === 'admin' ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Admin
              </button>
              <button
                onClick={() => setView('cliente')}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm rounded-sm font-medium transition-all ${view === 'cliente' ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Cliente
              </button>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9">
              📊 Exportar CSV
            </Button>
          </div>
        </header>

        {/* Common Metrics */}
        <MetricsCards records={records} isClientView={view === 'cliente'} />

        {/* View Content */}
        <div className="transition-all duration-300">
          {view === 'admin' ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AdminForm onAdd={handleAddRecord} />
              <AdminTable records={records} onDelete={handleDeleteRecord} />

              {opportunities.length > 0 && (
                <div className="bg-white border-2 border-amber-500/80 rounded-lg p-5 mb-8 shadow-sm">
                  <h2 className="text-amber-600 font-semibold text-sm mb-3 flex items-center gap-2">
                    ⚠️ Oportunidades no cubiertas
                  </h2>
                  <div className="space-y-0 mb-3">
                    {opportunities.map(opp => (
                      <div key={opp.id} className="py-2 border-b border-slate-100 last:border-0 text-xs text-slate-600">
                        <strong className="block text-slate-900 mb-1 text-sm">{opp.area}</strong>
                        {opp.impact}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 italic mt-3">
                    💡 Estos temas podrían evolucionar a servicios adicionales o expansión de horas.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ClientOverview records={records} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}