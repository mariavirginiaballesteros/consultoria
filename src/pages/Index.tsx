import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowRight, Trash2, Copy, DatabaseZap, X } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { JengibreFooter } from "@/components/JengibreFooter";
import { AREAS, DEFAULT_TYPES } from "@/lib/consulting-data";
import logoUrl from "@/assets/logo.jpg";

export default function Index() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [monthlyHours, setMonthlyHours] = useState(20);
  const [periodStartDay, setPeriodStartDay] = useState(1);
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
    }
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
    onError: (err) => {
      console.error(err);
      showError("Error al crear cliente. ¿Actualizaste la base de datos?");
    }
  });

  const resetForm = () => {
    setName("");
    setMonthlyHours(20);
    setPeriodStartDay(1);
    setAreas(AREAS);
    setTypes(DEFAULT_TYPES);
  };

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

  const handleCreate = () => {
    if (!name.trim()) {
      showError("El nombre es obligatorio");
      return;
    }
    createClient.mutate({
      name: name.trim(),
      monthly_hours: monthlyHours,
      period_start_day: periodStartDay,
      areas: areas,
      activity_types: types
    });
  };

  const addArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newArea.trim() && !areas.includes(newArea.trim())) {
      setAreas([...areas, newArea.trim()]);
      setNewArea("");
    }
  };

  const addType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newType.trim()) {
      const value = newType.trim().toLowerCase().replace(/\s+/g, '_');
      if (!types.find(t => t.value === value)) {
        setTypes([...types, { value, label: newType.trim() }]);
        setNewType("");
      }
    }
  };

  const copyLink = async (clientId: string) => {
    const url = `${window.location.origin}/client/${clientId}`;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess("Enlace copiado al portapapeles");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showSuccess("Enlace copiado al portapapeles");
      } catch (e) {
        showError("No se pudo copiar el enlace por seguridad del navegador.");
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 pt-10 flex flex-col font-sans">
      <div className="max-w-[800px] mx-auto px-4 flex-1 w-full">
        
        <header className="mb-10 text-center bg-[#2A2B73] p-10 rounded-3xl shadow-xl relative overflow-hidden border-b-4 border-[#D9E021]">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#E32462] rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#62BAD3] rounded-full blur-[80px] opacity-30"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <img src={logoUrl} alt="Jengibre Logo" className="h-24 w-24 rounded-2xl shadow-xl object-cover border-4 border-[#D9E021] mb-5" />
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              Portal de Consultoría
            </h1>
            <p className="text-[#62BAD3] text-lg font-medium">Administra tus clientes y horas de servicio</p>
          </div>
        </header>

        {error && (
          <Card className="mb-8 border-[#E32462] bg-[#E32462]/10 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <DatabaseZap className="h-6 w-6 text-[#E32462] shrink-0" />
                <div>
                  <h3 className="font-bold text-[#2A2B73] mb-1">Falta configurar la Base de Datos</h3>
                  <p className="text-sm text-slate-700">
                    Asegúrate de ejecutar el código SQL para agregar las nuevas columnas a la tabla clients.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#2A2B73]">Tus Clientes Activos</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D9E021] hover:bg-[#c6cc1b] text-[#2A2B73] font-bold shadow-md">
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-[#2A2B73]">Configurar Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                
                <div className="space-y-2">
                  <Label className="font-bold text-slate-600">Nombre de la Empresa</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Acme Corp" className="h-12 text-base" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-600">Horas mensuales</Label>
                    <Input type="number" min="1" value={monthlyHours} onChange={e => setMonthlyHours(Number(e.target.value))} className="h-12 text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-600">Día de inicio de ciclo</Label>
                    <Input type="number" min="1" max="28" value={periodStartDay} onChange={e => setPeriodStartDay(Number(e.target.value))} className="h-12 text-base" title="Día en que se reinicia el contador de horas" />
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Label className="font-bold text-slate-600">Áreas de Trabajo Personalizadas</Label>
                  <div className="flex gap-2">
                    <Input value={newArea} onChange={e => setNewArea(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArea(e)} placeholder="Nueva área..." className="bg-white" />
                    <Button onClick={addArea} type="button" variant="outline" className="bg-white">Agregar</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {areas.map(a => (
                      <span key={a} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm font-medium">
                        {a} <button type="button" onClick={() => setAreas(areas.filter(x => x !== a))}><X className="h-3 w-3 hover:text-[#E32462]"/></button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Label className="font-bold text-slate-600">Tipos de Actividad</Label>
                  <div className="flex gap-2">
                    <Input value={newType} onChange={e => setNewType(e.target.value)} onKeyDown={e => e.key === 'Enter' && addType(e)} placeholder="Nuevo tipo..." className="bg-white" />
                    <Button onClick={addType} type="button" variant="outline" className="bg-white">Agregar</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {types.map(t => (
                      <span key={t.value} className="bg-[#62BAD3]/10 border border-[#62BAD3]/20 text-[#2A2B73] px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm font-medium">
                        {t.label} <button type="button" onClick={() => setTypes(types.filter(x => x.value !== t.value))}><X className="h-3 w-3 hover:text-[#E32462]"/></button>
                      </span>
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreate} disabled={createClient.isPending} className="w-full h-12 bg-[#D9E021] text-[#2A2B73] font-bold hover:bg-[#c6cc1b] text-base shadow-md">
                  {createClient.isPending ? "Guardando..." : "Crear e Iniciar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="text-center py-10 text-slate-500 font-medium">Cargando clientes...</div>
        ) : clients.length === 0 && !error ? (
           <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">
             No tienes clientes todavía.
           </div>
        ) : (
          <div className="grid gap-4">
            {clients.map(client => (
              <Card key={client.id} className="shadow-sm hover:shadow-md transition-all border-slate-200 rounded-xl">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-[#2A2B73]">{client.name}</span>
                    {client.monthly_hours && <span className="text-xs text-slate-500 font-medium">{client.monthly_hours}h mensuales asignadas {client.period_start_day && client.period_start_day > 1 && `(Corte día ${client.period_start_day})`}</span>}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => copyLink(client.id)} className="flex-1 sm:flex-none border-slate-200 hover:bg-[#62BAD3]/10 hover:text-[#62BAD3]" title="Copiar enlace">
                      <Copy className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                    <Button onClick={() => navigate(`/admin/${client.id}`)} size="sm" className="flex-1 sm:flex-none bg-[#2A2B73] text-white hover:bg-[#1f2055]">
                      Gestionar <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if(window.confirm('¿Borrar este cliente y TODAS sus actividades?')) deleteClient.mutate(client.id);
                    }} className="text-slate-400 hover:text-[#E32462] hover:bg-[#E32462]/10 px-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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