import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowRight, Trash2, Copy, DatabaseZap } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { JengibreFooter } from "@/components/JengibreFooter";
import logoUrl from "@/assets/logo.jpg";

export default function Index() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newClientName, setNewClientName] = useState("");

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createClient = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('clients').insert([{ name }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setNewClientName("");
      showSuccess("Cliente creado con éxito");
      navigate(`/admin/${data.id}`);
    },
    onError: (err) => {
      console.error(err);
      showError("Error al crear cliente.");
    }
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    createClient.mutate(newClientName.trim());
  };

  const copyLink = (clientId: string) => {
    const url = `${window.location.origin}/client/${clientId}`;
    navigator.clipboard.writeText(url);
    showSuccess("Enlace de cliente copiado al portapapeles");
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 pt-10 flex flex-col font-sans">
      <div className="max-w-[800px] mx-auto px-4 flex-1 w-full">
        
        <header className="mb-10 text-center bg-[#2A2B73] p-10 rounded-3xl shadow-xl relative overflow-hidden border-b-4 border-[#D9E021]">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#E32462] rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#62BAD3] rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
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
                    Ejecuta el script SQL en Supabase para crear las tablas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-10 shadow-md border-slate-100 rounded-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#2A2B73]">Agregar nuevo cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
              <Input 
                placeholder="Nombre de la empresa o cliente..." 
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="flex-1 h-12 text-base focus-visible:ring-[#62BAD3]"
                disabled={createClient.isPending}
              />
              <Button type="submit" disabled={!newClientName.trim() || createClient.isPending} className="h-12 px-8 bg-[#D9E021] hover:bg-[#c6cc1b] text-[#2A2B73] font-bold">
                <Plus className="h-5 w-5 mr-2" />
                Crear Perfil
              </Button>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold mb-5 text-[#2A2B73]">Tus Clientes Activos</h2>
        
        {isLoading ? (
          <div className="text-center py-10 text-slate-500 font-medium">Cargando clientes...</div>
        ) : clients.length === 0 && !error ? (
           <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">
             No tienes clientes todavía. Crea el primero arriba.
           </div>
        ) : (
          <div className="grid gap-4">
            {clients.map(client => (
              <Card key={client.id} className="shadow-sm hover:shadow-md transition-all border-slate-200 rounded-xl">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="font-bold text-lg text-[#2A2B73]">
                    {client.name}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => copyLink(client.id)} className="flex-1 sm:flex-none border-slate-200 hover:bg-[#62BAD3]/10 hover:text-[#62BAD3]" title="Copiar enlace para el cliente">
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