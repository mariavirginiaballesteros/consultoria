import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MetricsCards } from "@/components/consulting/MetricsCards";
import { ClientOverview } from "@/components/consulting/ClientOverview";
import { ActivityRecord } from "@/lib/consulting-data";
import { Loader2 } from "lucide-react";

export default function ClientView() {
  const { clientId } = useParams();

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      return data;
    }
  });

  // El refetchInterval de 5000 hace que se actualice cada 5 segundos de forma automática (Tiempo Real)
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['activities', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('activities').select('*').eq('client_id', clientId).order('created_at', { ascending: true });
      if (error) throw error;
      return data as ActivityRecord[];
    },
    refetchInterval: 5000 
  });

  if (clientLoading || recordsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!client) {
    return <div className="min-h-screen p-10 text-center text-slate-600">Este enlace no es válido o el cliente fue eliminado.</div>;
  }

  const dateStr = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 pb-12 font-sans selection:bg-blue-200">
      <div className="max-w-[1200px] mx-auto px-4 pt-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 md:p-6 rounded-lg shadow-sm border border-slate-200 mb-8 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-semibold text-blue-600">🏦</span>
            <h1 className="text-xl md:text-2xl font-semibold text-blue-600">
              {client.name}
            </h1>
            <span className="text-xl md:text-2xl font-semibold text-blue-600 hidden md:inline-block">- {formattedDate}</span>
          </div>
          <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Sincronizado
          </div>
        </header>

        <MetricsCards records={records} isClientView={true} />

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ClientOverview records={records} />
        </div>
      </div>
    </div>
  );
}