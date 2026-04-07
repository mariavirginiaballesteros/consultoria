import { useState, useMemo, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { MetricsCards } from "@/components/consulting/MetricsCards";
import { ClientOverview } from "@/components/consulting/ClientOverview";
import { ActivityRecord, MONTHLY_BUDGET, DEFAULT_TYPES, getPeriodInfo, formatDate } from "@/lib/consulting-data";
import { Loader2, FileDown, CalendarDays, Clock, FileSignature, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JengibreFooter } from "@/components/JengibreFooter";
import { showSuccess, showError } from "@/utils/toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import logoUrl from "@/assets/logo.jpg";

export default function ClientView() {
  const { clientId } = useParams();
  const queryClient = useQueryClient();
  const { profile, logout } = useAuth();
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  // Protección de ruta: Solo los admins, o el cliente dueño, pueden ver esto
  if (profile?.role === 'client' && profile?.client_id !== clientId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5F8]">
        <h1 className="text-2xl font-bold text-[#E32462] mb-4">Acceso Denegado</h1>
        <p className="text-slate-600 mb-6">No tienes permisos para ver el reporte de esta empresa.</p>
        <Button onClick={logout} className="bg-[#2A2B73]">Cerrar sesión e intentar con otra cuenta</Button>
      </div>
    );
  }

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      return data;
    }
  });

  const { data: allRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['activities', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('activities').select('*').eq('client_id', clientId).order('date', { ascending: true });
      if (error) throw error;
      return data as ActivityRecord[];
    },
    refetchInterval: 5000 
  });

  // ... (Resto de la lógica idéntica)...
  const updateClientNote = useMutation({
    mutationFn: async ({ id, client_notes }: { id: string, client_notes: string }) => {
      const { error } = await supabase.from('activities').update({ client_notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities', clientId] }); showSuccess("Observación guardada"); }
  });

  const clientStartDay = client?.period_start_day || 1;

  useEffect(() => {
    if (client && !selectedPeriodId) {
      const current = getPeriodInfo(new Date().toISOString().split('T')[0], clientStartDay);
      setSelectedPeriodId(current.id);
    }
  }, [client, selectedPeriodId, clientStartDay]);

  const uniquePeriods = useMemo(() => {
    const periodsMap = new Map();
    allRecords.forEach(r => {
      const p = getPeriodInfo(r.date, clientStartDay);
      if (!periodsMap.has(p.id)) periodsMap.set(p.id, p);
    });
    const current = getPeriodInfo(new Date().toISOString().split('T')[0], clientStartDay);
    if (!periodsMap.has(current.id)) periodsMap.set(current.id, current);
    return Array.from(periodsMap.values()).sort((a, b) => b.id.localeCompare(a.id));
  }, [allRecords, clientStartDay]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => getPeriodInfo(r.date, clientStartDay).id === selectedPeriodId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allRecords, selectedPeriodId, clientStartDay]);

  const opportunities = filteredRecords.filter(r => r.opportunity);

  const generatePDF = async () => { /* Logica PDF... */ };

  if (clientLoading || recordsLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F5F8]"><Loader2 className="h-10 w-10 animate-spin text-[#D9E021]" /></div>;
  if (!client) return <div className="min-h-screen p-10 text-center text-slate-600 font-medium">Cliente eliminado o sin acceso.</div>;

  const clientHours = client.monthly_hours ?? MONTHLY_BUDGET;
  const clientTypes = client.activity_types ?? DEFAULT_TYPES;
  const typeLabelsMap = clientTypes.reduce((acc: any, t: any) => ({...acc, [t.value]: t.label}), {});
  const currentPeriodLabel = uniquePeriods.find(p => p.id === selectedPeriodId)?.label || '';

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 flex flex-col font-sans selection:bg-[#62BAD3]/30">
      
      {/* Botón flotante superior derecho (Salir) */}
      <div className="absolute top-4 right-4 z-50">
        <Button variant="outline" onClick={logout} className="bg-white/80 backdrop-blur-md text-slate-700 shadow-sm border-slate-200 hover:bg-white font-bold" data-html2canvas-ignore>
          <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
        </Button>
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" data-html2canvas-ignore>
        <Button onClick={generatePDF} disabled={isGeneratingPdf} className="bg-[#E32462] hover:bg-[#c21d51] text-white shadow-xl rounded-full h-14 px-6 font-bold text-base flex items-center gap-2 transition-transform hover:scale-105">
          {isGeneratingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
          {isGeneratingPdf ? "Generando..." : "Descargar PDF"}
        </Button>
      </div>

      <div id="pdf-content" className="max-w-[1200px] mx-auto px-4 pt-16 flex-1 w-full bg-[#F4F5F8] pb-10">
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center bg-[#2A2B73] p-6 md:p-8 rounded-2xl shadow-xl border-b-4 border-[#D9E021] mb-8 gap-4 overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#E32462] rounded-full blur-[80px] opacity-20"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
            <img src={logoUrl} alt="Jengibre Logo" className="h-16 w-16 rounded-2xl shadow-lg object-cover border-2 border-[#D9E021]" />
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{client.name}</h1>
              
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex flex-wrap items-center text-sm font-medium text-white bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                  <FileSignature className="h-4 w-4 mr-2 text-[#62BAD3]" /> Contrato: <strong className="ml-1 text-white">{clientHours}h mensuales</strong>
                  {client.contract_start_date && client.contract_duration_months && (
                    <span className="text-white/80 ml-1.5 hidden sm:inline"> • {client.contract_duration_months} meses (desde {formatDate(client.contract_start_date)})</span>
                  )}
                </span>
                <div className="flex items-center bg-black/20 px-3 py-1.5 rounded-lg border border-white/10" data-html2canvas-ignore>
                  <CalendarDays className="h-4 w-4 text-[#D9E021] mr-2" />
                  <select value={selectedPeriodId} onChange={e => setSelectedPeriodId(e.target.value)} className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer pr-2 appearance-none">
                    {uniquePeriods.map(p => <option key={p.id} value={p.id} className="text-slate-900 font-medium">{p.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center text-xs md:text-sm text-[#2A2B73] bg-[#D9E021] px-4 py-2 rounded-full font-bold shadow-sm mt-4 md:mt-0">
            <span className="relative flex h-2.5 w-2.5 mr-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            Reporte Ejecutivo
          </div>
        </header>

        <style dangerouslySetInnerHTML={{__html: `#pdf-content[data-rendering="true"] [data-html2canvas-ignore] { display: none !important; } #pdf-content[data-rendering="true"] [data-html2canvas-show] { display: block !important; }`}} />

        <MetricsCards records={filteredRecords} isClientView={true} monthlyHours={clientHours} />

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ClientOverview records={filteredRecords} monthlyHours={clientHours} typeLabels={typeLabelsMap} onUpdateClientNote={(id, note) => updateClientNote.mutate({ id, client_notes: note })} />
          {/* Opportunities list... */}
        </div>

        <div className="mt-8 pt-8">
          <JengibreFooter />
        </div>
      </div>
    </div>
  );
}