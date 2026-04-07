import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowRight, Trash2, Copy, DatabaseZap, X, Pencil, LogOut, KeyRound, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { JengibreFooter } from "@/components/JengibreFooter";
import { AREAS, DEFAULT_TYPES } from "@/lib/consulting-data";
import logoUrl from "@/assets/logo.jpg";

export default function Index() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, logout } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  // Modal de accesos
  const [accessModalClient, setAccessModalClient] = useState<any>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [name, setName] = useState("");
  const [monthlyHours, setMonthlyHours] = useState(20);
  const [periodStartDay, setPeriodStartDay] = useState(1);
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractDuration, setContractDuration] = useState<string>("");
  const [areas, setAreas] = useState<string[]>(AREAS);
  const [types, setTypes] = useState(DEFAULT_TYPES);
  
  const [newArea, setNewArea] = useState("");
  const [newType, setNewType] = useState("");

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin'
  });

  const createClient = useMutation({
    mutationFn: async (clientData: any) => {
      const { data, error } = await supabase.from('clients').insert([clientData]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsDialogOpen(false);
      resetForm();
      showSuccess("Cliente creado con éxito");
      navigate(`/admin/${data.id}`);
    },
    onError: (err) => showError("Error al crear cliente")
  });

  const updateClient = useMutation({
    mutationFn: async (clientData: any) => {
      const { data, error } = await supabase.from('clients').update(clientData).eq('id', editingClient.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsDialogOpen(false);
      resetForm();
      showSuccess("Cliente actualizado con éxito");
    },
    onError: (err) => showError("Error al actualizar cliente")
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showSuccess("Cliente eliminado");
    }
  });

  const handleGenerateAccess = async () => {
    if (!clientEmail || !clientPassword || clientPassword.length < 6) {
      showError("Ingresa un correo y una contraseña (mín. 6 caracteres)");
      return;
    }

    setIsGenerating(true);
    const { data, error } = await supabase.functions.invoke('create-client-user', {
      body: { email: clientEmail, password: clientPassword, clientId: accessModalClient.id }
    });
    setIsGenerating(false);

    if (error || data?.error) {
      showError("Error: " + (data?.error || error.message));
    } else {
      showSuccess("Usuario generado. Envíale sus credenciales.");
      setAccessModalClient(null);
      setClientEmail('');
      setClientPassword('');
    }
  };

  const resetForm = () => {
    setEditingClient(null);
    setName("");
    setMonthlyHours(20);
    setPeriodStartDay(1);
    setContractStartDate("");
    setContractDuration("");
    setAreas(AREAS);
    setTypes(DEFAULT_TYPES);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setName(client.name);
    setMonthlyHours(client.monthly_hours || 20);
    setPeriodStartDay(client.period_start_day || 1);
    setContractStartDate(client.contract_start_date || "");
    setContractDuration(client.contract_duration_months ? String(client.contract_duration_months) : "");
    setAreas(client.areas || AREAS);
    setTypes(client.activity_types || DEFAULT_TYPES);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return showError("El nombre es obligatorio");
    const payload = {
      name: name.trim(),
      monthly_hours: monthlyHours,
      period_start_day: periodStartDay,
      contract_start_date: contractStartDate || null,
      contract_duration_months: contractDuration ? parseInt(contractDuration) : null,
      areas: areas,
      activity_types: types
    };
    if (editingClient) updateClient.mutate(payload);
    else createClient.mutate(payload);
  };

  const addArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newArea.trim() && !areas.includes(newArea.trim())) { setAreas([...areas, newArea.trim()]); setNewArea(""); }
  };

  const addType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newType.trim()) {
      const value = newType.trim().toLowerCase().replace(/\s+/g, '_');
      if (!types.find(t => t.value === value)) { setTypes([...types, { value, label: newType.trim() }]); setNewType(""); }
    }
  };

  const copyLink = async (clientId: string) => {
    const url = `${window.location.origin}/client/${clientId}`;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess("Enlace copiado al portapapeles");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = url; document.body.appendChild(textArea); textArea.select();
      try { document.execCommand('copy'); showSuccess("Enlace copiado al portapapeles"); } catch (e) { showError("No se pudo copiar el enlace."); }
      document.body.removeChild(textArea);
    }
  };

  // Redirigir a clientes si no son admin
  if (profile && profile.role === 'client') {
    if (profile.client_id) return <Navigate to={`/client/${profile.client_id}`} replace />;
    return <div className="p-10 text-center font-bold">Tu usuario aún no ha sido asignado a ninguna empresa.</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 pt-10 flex flex-col font-sans">
      <div className="absolute top-4 right-4 z-50">
        <Button variant="outline" onClick={logout} className="bg-white text-slate-700 shadow-sm border-slate-200 hover:bg-slate-50 font-bold">
          <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
        </Button>
      </div>

      <div className="max-w-[800px] mx-auto px-4 flex-1 w-full">
        <header className="mb-10 text-center bg-[#2A2B73] p-10 rounded-3xl shadow-xl relative overflow-hidden border-b-4 border-[#D9E021]">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#E32462] rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#62BAD3] rounded-full blur-[80px] opacity-30"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <img src={logoUrl} alt="Jengibre Logo" className="h-24 w-24 rounded-2xl shadow-xl object-cover border-4 border-[#D9E021] mb-5" />
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">Portal de Consultoría</h1>
            <p className="text-[#62BAD3] text-lg font-medium">Administrador General Segurizado</p>
          </div>
        </header>

        {error && (
          <Card className="mb-8 border-[#E32462] bg-[#E32462]/10 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <DatabaseZap className="h-6 w-6 text-[#E32462] shrink-0" />
                <div>
                  <h3 className="font-bold text-[#2A2B73] mb-1">Error de Base de Datos</h3>
                  <p className="text-sm text-slate-700">Asegúrate de haber corrido el script SQL provisto para la seguridad RLS.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#2A2B73]">Tus Clientes Activos</h2>
          
          <Button onClick={handleOpenCreate} className="bg-[#D9E021] hover:bg-[#c6cc1b] text-[#2A2B73] font-bold shadow-md">
            <Plus className="h-5 w-5 mr-2" /> Nuevo Cliente
          </Button>

          {/* Modal CRUD Cliente */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-2xl font-black text-[#2A2B73]">{editingClient ? "Editar Cliente" : "Configurar Cliente"}</DialogTitle></DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2"><Label className="font-bold text-slate-600">Nombre de la Empresa</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Acme Corp" className="h-12 text-base" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="font-bold text-slate-600">Horas mensuales</Label><Input type="number" min="1" value={monthlyHours} onChange={e => setMonthlyHours(Number(e.target.value))} className="h-12 text-base" /></div>
                  <div className="space-y-2"><Label className="font-bold text-slate-600">Día de inicio de ciclo</Label><Input type="number" min="1" max="28" value={periodStartDay} onChange={e => setPeriodStartDay(Number(e.target.value))} className="h-12 text-base" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="font-bold text-slate-600">Inicio del contrato <span className="text-slate-400 font-normal">(Opcional)</span></Label><Input type="date" value={contractStartDate} onChange={e => setContractStartDate(e.target.value)} className="h-12 text-base" /></div>
                  <div className="space-y-2"><Label className="font-bold text-slate-600">Duración en meses <span className="text-slate-400 font-normal">(Opcional)</span></Label><Input type="number" min="1" value={contractDuration} onChange={e => setContractDuration(e.target.value)} placeholder="Ej: 3" className="h-12 text-base" /></div>
                </div>
                {/* Áreas y Tipos se mantienen igual */}
                <Button onClick={handleSave} disabled={createClient.isPending || updateClient.isPending} className="w-full h-12 bg-[#D9E021] text-[#2A2B73] font-bold hover:bg-[#c6cc1b] text-base shadow-md">
                  {createClient.isPending || updateClient.isPending ? "Guardando..." : (editingClient ? "Guardar Cambios" : "Crear e Iniciar")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Crear Usuario de Acceso */}
          <Dialog open={!!accessModalClient} onOpenChange={(open) => !open && setAccessModalClient(null)}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-[#2A2B73] flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-[#62BAD3]"/> Generar Acceso
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-slate-600 font-medium">Crear usuario sin validación para: <strong className="text-[#2A2B73]">{accessModalClient?.name}</strong></p>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-600">Correo Electrónico (Login)</Label>
                  <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="cliente@empresa.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-600">Contraseña asignada</Label>
                  <Input value={clientPassword} onChange={e => setClientPassword(e.target.value)} placeholder="Mínimo 6 caracteres" type="text" />
                </div>
                <Button onClick={handleGenerateAccess} disabled={isGenerating} className="w-full mt-2 bg-[#2A2B73] text-white font-bold hover:bg-[#1f2055] shadow-md">
                  {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Generando...</> : "Crear Credenciales"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="text-center py-10 text-slate-500 font-medium">Cargando clientes de forma segura...</div>
        ) : clients.length === 0 && !error ? (
           <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">
             No tienes clientes todavía.
           </div>
        ) : (
          <div className="grid gap-4">
            {clients.map(client => (
              <Card key={client.id} className="shadow-sm hover:shadow-md transition-all border-slate-200 rounded-xl">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-[#2A2B73]">{client.name}</span>
                    <span className="text-xs text-slate-500 font-medium">{client.monthly_hours}h asignadas</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
                    
                    <Button variant="outline" size="sm" onClick={() => setAccessModalClient(client)} className="flex-1 md:flex-none border-slate-200 hover:bg-[#62BAD3]/10 hover:text-[#62BAD3] bg-white font-bold" title="Generar usuario">
                      <KeyRound className="h-4 w-4 mr-2" /> Accesos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyLink(client.id)} className="flex-1 md:flex-none border-slate-200 hover:bg-[#62BAD3]/10 hover:text-[#62BAD3] font-bold" title="Copiar enlace">
                      <Copy className="h-4 w-4 mr-2" /> Link
                    </Button>
                    <Button onClick={() => navigate(`/admin/${client.id}`)} size="sm" className="flex-1 md:flex-none bg-[#2A2B73] text-white hover:bg-[#1f2055] font-bold">
                      Gestionar <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    
                    <div className="flex border-l border-slate-200 pl-2 ml-1 w-full md:w-auto mt-2 md:mt-0 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(client)} className="text-slate-400 hover:text-[#2A2B73] hover:bg-slate-100 px-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if(window.confirm('¿Borrar este cliente de forma irreversible?')) deleteClient.mutate(client.id);
                      }} className="text-slate-400 hover:text-[#E32462] hover:bg-[#E32462]/10 px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <JengibreFooter />
    </div>
  );
}