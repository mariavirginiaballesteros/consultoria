import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricsCards } from "@/components/consulting/MetricsCards";
import { AdminForm } from "@/components/consulting/AdminForm";
import { AdminTable } from "@/components/consulting/AdminTable";
import { showSuccess, showError } from "@/utils/toast";
import { ActivityRecord, TYPE_LABELS } from "@/lib/consulting-data";

export default function ClientAdmin() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      return data;
    }
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['activities', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('activities').select('*').eq('client_id', clientId).order('created_at', { ascending: true });
      if (error) throw error;
      return data as ActivityRecord[];
    }
  });

  const addRecord = useMutation({
    mutationFn: async (newRecord: Omit<ActivityRecord, 'id' | 'client_id' | 'created_at'>) => {
      const { data, error } = await supabase.from('activities').insert([{ ...newRecord, client_id: clientId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', clientId] });
    },
    onError: () => showError("Error al guardar la actividad")
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', clientId] });
      showSuccess("Actividad eliminada");
    }
  });

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
    link.download = `reporte-${client?.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const newRecords = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = [];
        let insideQuote = false;
        let currentStr = "";
        for (let j = 0; j < line.length; j++) {
          if (line[j] === '"') {
            insideQuote = !insideQuote;
          } else if (line[j] === ',' && !insideQuote) {
            cols.push(currentStr);
            currentStr = "";
          } else {
            currentStr += line[j];
          }
        }
        cols.push(currentStr);

        if (cols.length >= 4 && cols[0]) {
          const typeStr = (cols[1] || '').toLowerCase();
          const typeMap = typeStr.includes('reunión') ? 'reunion' : typeStr.includes('reporte') ? 'reporte' : 'trabajo';

          newRecords.push({
            client_id: clientId,
            date: cols[0],
            type: typeMap,
            area: cols[2] || 'Otros',
            hours: parseFloat(cols[3]) || 0,
            impact: cols[4] || '',
            opportunity: (cols[5] || '').toLowerCase() === 'sí' || (cols[5] || '').toLowerCase() === 'si',
            notes: cols[6] || ''
          });
        }
      }

      if (newRecords.length > 0) {
        const { error } = await supabase.from('activities').insert(newRecords);
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['activities', clientId] });
          showSuccess(`Se importaron ${newRecords.length} actividades correctamente`);
        } else {
          showError("Error guardando en la base de datos");
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyClientLink = () => {
    const url = `${window.location.origin}/client/${clientId}`;
    navigator.clipboard.writeText(url);
    showSuccess("Enlace copiado. ¡Envíalo a tu cliente!");
  };

  if (clientLoading) return <div className="min-h-screen p-10 text-center">Cargando...</div>;
  if (!client) return <div className="min-h-screen p-10 text-center">Cliente no encontrado</div>;

  const opportunities = records.filter(r => r.opportunity);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 pb-12 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 pt-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-lg shadow-sm border border-slate-200 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-500 hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold text-blue-600 flex items-center gap-2">
              🏦 {client.name} <span className="text-sm font-normal text-slate-400 ml-2">(Admin)</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-9">
              <Upload className="h-4 w-4 mr-2" /> Importar
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="h-9">
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
            <Button onClick={copyClientLink} className="h-9 bg-slate-900 text-white hover:bg-slate-800">
              <Copy className="h-4 w-4 mr-2" /> Link Cliente
            </Button>
          </div>
        </header>

        <MetricsCards records={records} isClientView={false} />

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <AdminForm onAdd={(data) => addRecord.mutate(data)} />
          <AdminTable records={records} onDelete={(id) => {
            if(window.confirm("¿Seguro que deseas borrar esto?")) deleteRecord.mutate(id);
          }} />

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}