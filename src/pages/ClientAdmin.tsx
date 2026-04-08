import { useState, useRef, useMemo, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { ArrowLeft, Copy, Download, Upload, Settings, CalendarDays, Clock, ExternalLink, FileSignature, LogOut, FileText, Receipt, Trash2, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricsCards } from "@/components/consulting/MetricsCards";
import { AdminForm } from "@/components/consulting/AdminForm";
import { AdminTable } from "@/components/consulting/AdminTable";
import { EditActivityDialog } from "@/components/consulting/EditActivityDialog";
import { showSuccess, showError } from "@/utils/toast";
import { ActivityRecord, MONTHLY_BUDGET, AREAS, DEFAULT_TYPES, getPeriodInfo, formatDate } from "@/lib/consulting-data";
import { JengibreFooter } from "@/components/JengibreFooter";
import logoUrl from "@/assets/logo.jpg";

export default function ClientAdmin() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const proposalInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [editingRecord, setEditingRecord] = useState<ActivityRecord | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  if (profile?.role !== 'admin') return <Navigate to="/" replace />;

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
    }
  });

  const updateClientDocs = useMutation({
    mutationFn: async (clientData: any) => {
      const { data, error } = await supabase.from('clients').update(clientData).eq('id', clientId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      showSuccess("Documento actualizado correctamente");
    },
    onError: () => showError("Error al actualizar documentos")
  });

  const clientStartDay = client?.period_start_day || 1;

  useEffect(() => {
    if (client && !selectedPeriodId) {
      const current = getPeriodInfo(new Date().toISOString().split('T')[0], clientStartDay);
      setSelectedPeriodId(current.id);
    }
  }, [client, selectedPeriodId, clientStartDay]);

  const addRecord = useMutation({
    mutationFn: async (newRecord: Omit<ActivityRecord, 'id' | 'client_id' | 'created_at'>) => {
      const { data, error } = await supabase.from('activities').insert([{ ...newRecord, client_id: clientId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities', clientId] });
      const recordPeriod = getPeriodInfo(data.date, clientStartDay);
      if (recordPeriod.id !== selectedPeriodId) setSelectedPeriodId(recordPeriod.id);
    }
  });

  const updateRecord = useMutation({
    mutationFn: async (updatedRecord: ActivityRecord) => {
      const { id, client_id, created_at, ...updateData } = updatedRecord;
      const { data, error } = await supabase.from('activities').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities', clientId] });
      setEditingRecord(null);
      showSuccess("Actividad actualizada correctamente");
      const recordPeriod = getPeriodInfo(data.date, clientStartDay);
      if (recordPeriod.id !== selectedPeriodId) setSelectedPeriodId(recordPeriod.id);
    }
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('activities').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities', clientId] })
  });

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

  const clientTypes = client?.activity_types ?? DEFAULT_TYPES;

  const handleExportCSV = () => {
    const typeLabelsMap = clientTypes.reduce((acc: any, t: any) => ({...acc, [t.value]: t.label}), {});
    const rows = [['Fecha', 'Tipo', 'Área', 'Horas', 'Impacto', 'Oportunidad No Cubierta', 'Notas']];
    filteredRecords.forEach(r => {
      rows.push([
        r.date, typeLabelsMap[r.type] || r.type, r.area, r.hours.toString(),
        r.impact, r.opportunity ? 'Sí' : 'No', r.notes || ''
      ]);
    });
    const csvContent = rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-${client?.name.toLowerCase().replace(/\s+/g, '-')}-${selectedPeriodId}.csv`;
    link.click();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    const reverseTypeMap = clientTypes.reduce((acc: any, t: any) => { acc[t.label.toLowerCase().trim()] = t.value; return acc; }, {});
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/);
      const newRecords = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = []; let insideQuote = false; let currentStr = "";
        for (let j = 0; j < line.length; j++) {
          if (line[j] === '"') insideQuote = !insideQuote;
          else if (line[j] === ',' && !insideQuote) { cols.push(currentStr.trim()); currentStr = ""; }
          else currentStr += line[j];
        }
        cols.push(currentStr.trim());
        if (cols.length >= 4 && cols[0]) {
          const importedLabel = (cols[1] || '').toLowerCase().trim();
          const typeMap = reverseTypeMap[importedLabel] || clientTypes[0]?.value || 'trabajo';
          const parsedHours = parseFloat((cols[3] || '0').replace(',', '.'));
          const oppStr = (cols[5] || '').toLowerCase().trim();
          newRecords.push({
            client_id: clientId, date: cols[0], type: typeMap, area: cols[2] || 'Otros',
            hours: isNaN(parsedHours) ? 0 : parsedHours, impact: cols[4] || '',
            opportunity: oppStr === 'sí' || oppStr === 'si' || oppStr === 'true' || oppStr === 'yes', notes: cols[6] || ''
          });
        }
      }
      if (newRecords.length > 0) {
        const { error } = await supabase.from('activities').insert(newRecords);
        if (!error) { queryClient.invalidateQueries({ queryKey: ['activities', clientId] }); showSuccess(`Se importaron ${newRecords.length} actividades correctamente`); } 
        else showError("Error guardando en la base de datos");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyClientLink = async () => {
    const url = `${window.location.origin}/client/${clientId}`;
    try { await navigator.clipboard.writeText(url); showSuccess("Enlace copiado."); } 
    catch (err) { const ta = document.createElement("textarea"); ta.value = url; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); showSuccess("Enlace copiado."); } catch (e) { showError("No se pudo copiar el enlace."); } document.body.removeChild(ta); }
  };

  const uploadFile = async (file: File, prefix: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${prefix}_${clientId}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('documents').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
    return { name: file.name, url: publicUrl, date: new Date().toISOString() };
  };

  const handleUploadProposal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc('proposal');
    try {
      const fileData = await uploadFile(file, 'propuesta');
      updateClientDocs.mutate({ proposal_url: fileData.url });
    } catch (err) {
      showError("Error al subir el archivo (¿Ejecutaste el SQL del bucket?)");
    } finally {
      setUploadingDoc(null);
      if (proposalInputRef.current) proposalInputRef.current.value = '';
    }
  };

  const handleUploadInvoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc('invoice');
    try {
      const fileData = await uploadFile(file, 'factura');
      const currentInvoices = client?.invoices || [];
      updateClientDocs.mutate({ invoices: [fileData, ...currentInvoices] });
    } catch (err) {
      showError("Error al subir la factura (¿Ejecutaste el SQL del bucket?)");
    } finally {
      setUploadingDoc(null);
      if (invoiceInputRef.current) invoiceInputRef.current.value = '';
    }
  };

  const removeInvoice = (index: number) => {
    if (!window.confirm("¿Quitar esta factura de la lista?")) return;
    const currentInvoices = [...(client?.invoices || [])];
    currentInvoices.splice(index, 1);
    updateClientDocs.mutate({ invoices: currentInvoices });
  };

  if (clientLoading) return <div className="min-h-screen p-10 text-center font-medium">Cargando datos...</div>;
  if (!client) return <div className="min-h-screen p-10 text-center font-medium">Cliente no encontrado</div>;

  const clientHours = client.monthly_hours ?? MONTHLY_BUDGET;
  const isServiceOnly = clientHours === 0;
  const clientAreas = client.areas ?? AREAS;
  const typeLabelsMap = clientTypes.reduce((acc: any, t: any) => ({...acc, [t.value]: t.label}), {});
  const opportunities = filteredRecords.filter(r => r.opportunity);
  const invoices = client.invoices || [];

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 flex flex-col font-sans">
      <div className="max-w-[1200px] mx-auto px-4 pt-8 flex-1 w-full">
        <div className="flex justify-end mb-4"><Button variant="ghost" onClick={logout} className="text-slate-500 hover:text-[#2A2B73] font-bold"><LogOut className="h-4 w-4 mr-2" /> Salir</Button></div>
        <header className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#2A2B73] p-5 md:p-6 rounded-2xl shadow-lg border-b-4 border-[#D9E021] mb-8 gap-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#62BAD3] rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/10 shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Jengibre Logo" className="h-12 w-12 rounded-xl shadow-md object-cover border-2 border-[#D9E021]" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-white leading-tight truncate max-w-[200px] sm:max-w-full">{client.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-[#D9E021] flex items-center gap-1"><Settings className="h-3 w-3" /> Admin</span>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-xs font-medium text-white/80 flex items-center flex-wrap gap-1">
                    <FileSignature className="h-3 w-3 text-[#62BAD3]" /> Contrato: 
                    {clientHours > 0 ? <strong className="text-white ml-1">{clientHours}h/mes</strong> : <strong className="text-white ml-1">Por Servicios</strong>}
                    {client.services && client.services.length > 0 && (
                      <>
                        <span className="text-white/40 mx-1">•</span>
                        <span className="text-[#2A2B73] bg-[#D9E021] px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {client.services.join(', ')}
                        </span>
                      </>
                    )}
                    {client.contract_start_date && client.contract_duration_months && <span className="text-white/60 ml-1"> ({client.contract_duration_months} meses)</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
            <div className="flex items-center gap-2 sm:mr-4 bg-black/20 p-1.5 rounded-lg border border-white/10">
              <CalendarDays className="h-4 w-4 text-[#D9E021] ml-2" />
              <select value={selectedPeriodId} onChange={e => setSelectedPeriodId(e.target.value)} className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer pr-2 appearance-none">
                {uniquePeriods.map(p => <option key={p.id} value={p.id} className="text-slate-900 font-medium">{p.label}</option>)}
              </select>
            </div>
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="h-9 border-white/20 bg-white/5 text-white hover:bg-white/20 hover:text-white flex-1 sm:flex-none"><Upload className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Importar</span></Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="h-9 border-white/20 bg-white/5 text-white hover:bg-white/20 hover:text-white flex-1 sm:flex-none"><Download className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Exportar Mes</span></Button>
            <Button onClick={() => window.open(`/client/${clientId}`, '_blank')} variant="outline" size="sm" className="h-9 border-white/20 bg-white/5 text-white hover:bg-white/20 hover:text-white flex-1 sm:flex-none" title="Abrir vista de cliente"><ExternalLink className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Ver Vista</span></Button>
            <Button onClick={copyClientLink} size="sm" className="h-9 bg-[#D9E021] text-[#2A2B73] hover:bg-[#c6cc1b] font-bold flex-1 sm:flex-none"><Copy className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Copiar Link Público</span></Button>
          </div>
        </header>

        <MetricsCards records={filteredRecords} isClientView={false} monthlyHours={clientHours} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <h3 className="font-bold text-[#2A2B73] mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-[#D9E021]" /> Propuesta Comercial</h3>
              {client.proposal_url ? (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <a href={client.proposal_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#62BAD3] hover:underline flex items-center">
                    <ExternalLink className="h-3 w-3 mr-1" /> Ver Propuesta Actual
                  </a>
                  <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-[#E32462]" onClick={() => updateClientDocs.mutate({ proposal_url: null })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200 text-center">
                  No hay propuesta cargada.
                </div>
              )}
              <div className="mt-3">
                <input type="file" className="hidden" ref={proposalInputRef} onChange={handleUploadProposal} accept=".pdf,.doc,.docx" />
                <Button variant="outline" className="w-full font-bold text-xs" onClick={() => proposalInputRef.current?.click()} disabled={uploadingDoc === 'proposal'}>
                  {uploadingDoc === 'proposal' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2 text-[#2A2B73]" />} 
                  {client.proposal_url ? 'Reemplazar archivo' : 'Subir Propuesta'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <h3 className="font-bold text-[#2A2B73] mb-3 flex items-center gap-2"><Receipt className="h-4 w-4 text-[#62BAD3]" /> Facturas Emitidas</h3>
              <div className="space-y-2 mb-3 max-h-[100px] overflow-y-auto">
                {invoices.length === 0 ? (
                  <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">Sin facturas registradas.</div>
                ) : (
                  invoices.map((inv: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                      <a href={inv.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#2A2B73] hover:text-[#62BAD3] truncate max-w-[200px]">
                        {inv.name}
                      </a>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{new Date(inv.date).toLocaleDateString()}</span>
                        <button onClick={() => removeInvoice(idx)} className="text-slate-400 hover:text-[#E32462]"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <input type="file" className="hidden" ref={invoiceInputRef} onChange={handleUploadInvoice} accept=".pdf,.jpg,.jpeg,.png" />
              <Button variant="outline" className="w-full font-bold text-xs" onClick={() => invoiceInputRef.current?.click()} disabled={uploadingDoc === 'invoice'}>
                {uploadingDoc === 'invoice' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2 text-[#2A2B73]" />} 
                Añadir Factura
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <AdminForm onAdd={(data) => addRecord.mutate(data)} areas={clientAreas} activityTypes={clientTypes} isServiceOnly={isServiceOnly} />
          <AdminTable records={filteredRecords} onEdit={(record) => setEditingRecord(record)} onDelete={(ids) => bulkDelete.mutate(ids)} typeLabels={typeLabelsMap} isServiceOnly={isServiceOnly} />
          {opportunities.length > 0 && (
            <div className="bg-white border-2 border-[#E32462]/30 rounded-xl p-6 mb-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E32462]"></div>
              <h2 className="text-[#E32462] font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wide">🚀 Oportunidades de proyectos extra</h2>
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
      </div>
      <EditActivityDialog record={editingRecord} isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} onSave={(data) => updateRecord.mutate(data)} areas={clientAreas} activityTypes={clientTypes} isServiceOnly={isServiceOnly} />
      <JengibreFooter />
    </div>
  );
}