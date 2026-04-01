import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, ArrowRight, Trash2, Copy, DatabaseZap } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

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
      showError("Error al crear cliente. ¿Ejecutaste el script SQL en Supabase?");
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
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 py-12 font-sans">
      <div className="max-w-[800px] mx-auto px-4">
        
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Portal de Consultoría
          </h1>
          <p className="text-slate-500">Administra tus clientes y horas de servicio</p>
        </header>

        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <DatabaseZap className="h-6 w-6 text-red-600 shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Falta configurar la Base de Datos</h3>
                  <p className="text-sm text-red-800 mb-3">
                    Parece que las tablas en Supabase aún no existen. Por favor, ve a tu proyecto en Supabase, abre el "SQL Editor" y ejecuta el script de configuración.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 shadow-sm border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Agregar nuevo cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-3">
              <Input 
                placeholder="Nombre de la empresa o cliente..." 
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="flex-1"
                disabled={createClient.isPending}
              />
              <Button type="submit" disabled={!newClientName.trim() || createClient.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Crear
              </Button>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-4 text-slate-800">Tus Clientes Activos</h2>
        
        {isLoading ? (
          <div className="text-center py-10 text-slate-500">Cargando clientes...</div>
        ) : clients.length === 0 && !error ? (
           <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-300 text-slate-500">
             No tienes clientes todavía. Crea el primero arriba.
           </div>
        ) : (
          <div className="grid gap-4">
            {clients.map(client => (
              <Card key={client.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="font-semibold text-lg text-slate-900">
                    {client.name}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => copyLink(client.id)} className="flex-1 sm:flex-none" title="Copiar enlace para el cliente">
                      <Copy className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                    <Button onClick={() => navigate(`/admin/${client.id}`)} size="sm" className="flex-1 sm:flex-none bg-slate-900 text-white hover:bg-slate-800">
                      Gestionar <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if(window.confirm('¿Borrar este cliente y TODAS sus actividades?')) deleteClient.mutate(client.id);
                    }} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}