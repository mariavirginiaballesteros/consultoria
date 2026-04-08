import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { MetricsCards } from "@/components/consulting/MetricsCards";
import { ClientOverview } from "@/components/consulting/ClientOverview";
import { ActivityRecord, MONTHLY_BUDGET, DEFAULT_TYPES, getPeriodInfo, formatDate } from "@/lib/consulting-data";
import { Loader2, FileDown, CalendarDays, Clock, FileSignature, LogOut, FileText, Receipt, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JengibreFooter } from "@/components/JengibreFooter";
import { showSuccess, showError } from "@/utils/toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import logoUrl from "@/assets/logo.jpg";

export default function ClientView() {
  const { clientId } = useParams();
  const queryClient = useQueryClient();
  const { session, logout } = useAuth();
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

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

  const generatePDF = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return;
    
    setIsGeneratingPdf(true);
    
    // Set rendering attribute to apply specific print CSS rules
    element.setAttribute("data-rendering", "true");
    
    // Give DOM time to reflow and apply the print styles (expand containers, hide buttons)
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      // Usamos windowWidth de 1200 para forzar diseño de computadora aunque estén en un móvil
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        backgroundColor: "#F4F5F8",
        windowWidth: 1200
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      // Creamos un PDF de UNA SOLA PÁGINA (Página continua). 
      // Esto previene los cortes horribles a la mitad del texto.
      const pdfWidth = canvas.width / 2; 
      const pdfHeight = canvas.height / 2;
      
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "px", 
        format: [pdfWidth, pdfHeight] 
      });
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_Jengibre_${client?.name.replace(/\s+/g, '_')}_${selectedPeriodId}.pdf`);
      
      showSuccess("PDF descargado correctamente");
    } catch (error) { 
      console.error(error); 
      showError("Hubo un error al generar el PDF"); 
    } finally { 
      element.removeAttribute("data-rendering");
      setIsGeneratingPdf(false); 
    }
  };

  if (clientLoading || recordsLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F5F8]"><Loader2 className="h-10 w-10 animate-spin text-[#D9E021]" /></div>;
  if (!client) return <div className="min-h-screen p-10 text-center text-slate-600 font-medium">El reporte de esta empresa no está disponible o el enlace es incorrecto.</div>;

  const clientHours = client.monthly_hours ?? MONTHLY_BUDGET;
  const isServiceOnly = clientHours === 0;
  const clientTypes = client.activity_types ?? DEFAULT_TYPES;
  const typeLabelsMap = clientTypes.reduce((acc: any, t: any) => ({...acc, [t.value]: t.label}), {});
  const currentPeriodLabel = uniquePeriods.find(p => p.id === selectedPeriodId)?.label || '';
  const invoices = client.invoices || [];

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 flex flex-col font-sans selection:bg-[#62BAD3]/30">
      
      {session && (
        <div className="absolute top-4 right-4 z-50">
          <Button variant="outline" onClick={logout} className="bg-white/80 backdrop-blur-md text-slate-700 shadow-sm border-slate-200 hover:bg-white font-bold" data-html2canvas-ignore>
            <LogOut className="h-4 w-4 mr-2" /> Modo Admin (Salir)
          </Button>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" data-html2canvas-ignore>
        <Button onClick={generatePDF} disabled={isGeneratingPdf} className="bg-[#E32462] hover:bg-[#c21d51] text-white shadow-xl rounded-full h-14 px-6 font-bold text-base flex items-center gap-2 transition-transform hover:scale-105">
          {isGeneratingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
          {isGeneratingPdf ? "Generando..." : "Descargar PDF"}
        </Button>
      </div>

      <div id="pdf-content" className="max-w-[1200px] mx-auto px-4 pt-16 flex-1 w-full bg-[#F4F5F8] pb-10 transition-all duration-300">
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center bg-[#2A2B73] p-6 md:p-8 rounded-2xl shadow-xl border-b-4 border-[#D9E021] mb-8 gap-4 overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#E32462] rounded-full blur-[80px] opacity-20"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
            <img src={logoUrl} alt="Jengibre Logo" className="h-16 w-16 rounded-2xl shadow-lg object-cover border-2 border-[#D9E021]" />
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{client.name}</h1>
              
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex flex-wrap items-center text-sm font-medium text-white bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                  <FileSignature className="h-4 w-4 mr-2 text-[#62BAD3]" /> Contrato: 
                  {!isServiceOnly ? <strong className="ml-1 text-white">{clientHours}h mensuales</strong> : <strong className="ml-1 text-white">Por Servicios</strong>}
                  
                  {client.services && client.services.length > 0 && (
                    <>
                      <span className="text-white/40 mx-2">|</span>
                      <span className="text-[#2A2B73] bg-[#D9E021] px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {client.services.join(' • ')}
                      </span>
                    </>
                  )}
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

        {/* Estilos especiales para el momento de la captura del PDF */}
        <style dangerouslySetInnerHTML={{__html: `
          #pdf-content[data-rendering="true"] { 
            padding: 40px !important; 
            background-color: #F4F5F8 !important; 
            width: 1200px !important; 
            max-width: 1200px !important; 
            margin: 0 auto !important;
          }
          #pdf-content[data-rendering="true"] .overflow-y-auto { 
            max-height: none !important; 
            overflow: visible !important; 
          }
          #pdf-content[data-rendering="true"] [data-html2canvas-ignore] { 
            display: none !important; 
          }
          #pdf-content[data-rendering="true"] [data-html2canvas-show] { 
            display: block !important; 
          }
        `}} />

        {(client.proposal_url || invoices.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" data-html2canvas-ignore>
            {client.proposal_url && (
              <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#D9E021]/20 p-2.5 rounded-lg"><FileText className="h-5 w-5 text-[#2A2B73]" /></div>
                    <div>
                      <h3 className="font-bold text-[#2A2B73] text-sm">Propuesta Comercial</h3>
                      <p className="text-xs text-slate-500 font-medium">Ver documento de términos pactados</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="font-bold text-[#62BAD3] border-[#62BAD3]/30 hover:bg-[#62BAD3]/10" onClick={() => window.open(client.proposal_url, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Abrir
                  </Button>
                </CardContent>
              </Card>
            )}

            {invoices.length > 0 && (
              <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-[#62BAD3]/20 p-2.5 rounded-lg"><Receipt className="h-5 w-5 text-[#2A2B73]" /></div>
                    <h3 className="font-bold text-[#2A2B73] text-sm">Facturas Disponibles</h3>
                  </div>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
                    {invoices.map((inv: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-md border border-slate-100">
                        <span className="font-bold text-slate-700 truncate max-w-[200px]">{inv.name}</span>
                        <a href={inv.url} target="_blank" rel="noreferrer" className="text-[#62BAD3] hover:text-[#4a9bb2] font-bold text-xs flex items-center">
                          <FileDown className="h-3 w-3 mr-1" /> Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <MetricsCards records={filteredRecords} isClientView={true} monthlyHours={clientHours} />

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ClientOverview records={filteredRecords} monthlyHours={clientHours} typeLabels={typeLabelsMap} onUpdateClientNote={(id, note) => updateClientNote.mutate({ id, client_notes: note })} />
          
          {opportunities.length > 0 && (
            <div className="bg-white border-2 border-[#E32462]/30 rounded-xl p-6 mt-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E32462]"></div>
              <h2 className="text-[#E32462] font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wide">🚀 Oportunidades de proyectos extra detectadas ({currentPeriodLabel})</h2>
              <div className="space-y-0 mb-2">
                {opportunities.map(opp => (
                  <div key={opp.id} className="py-3 border-b border-slate-100 last:border-0 text-sm text-slate-600 flex justify-between items-start gap-4">
                    <div><strong className="block text-[#2A2B73] mb-1 font-bold">{opp.area}</strong>{opp.impact}</div>
                    {!isServiceOnly && opp.hours > 0 && <span className="shrink-0 flex items-center font-bold text-xs text-[#2A2B73] bg-slate-100 px-2 py-1 rounded"><Clock className="h-3 w-3 mr-1" /> {opp.hours}h estimadas</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 pt-8"><JengibreFooter /></div>
      </div>
    </div>
  );
}