import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MetricsCards } from "@/components/consulting/MetricsCards";
import { ClientOverview } from "@/components/consulting/ClientOverview";
import { ActivityRecord } from "@/lib/consulting-data";
import { Loader2 } from "lucide-react";
import { JengibreFooter } from "@/components/JengibreFooter";
import logoUrl from "@/assets/logo.jpg";

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
        <Loader2 className="h-8 w-8 animate-spin text-[#2b2d75]" />
      </div>
    );
  }

  if (!client) {
    return <div className="min-h-screen p-10 text-center text-slate-600">Este enlace no es válido o el cliente fue eliminado.</div>;
  }

  const dateStr = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 flex flex-col font-sans selection:bg-[#2b2d75]/20">
      <div className="max-w-[1200px] mx-auto px-4 pt-8 flex-1 w-full">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 md:p-6 rounded-lg shadow-sm border border-slate-200 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <img src={logoUrl} alt="Jengibre Logo" className="h-12 w-12 rounded-lg shadow-sm object-cover" />
            <div className="flex flex-col md:flex-row md:items-center md:gap-2">
              <h1 className="text-xl md:text-2xl font-semibold text-[#2b2d75]">
                {client.name}
              </h1>
              <span className="text-slate-400 font-medium hidden md:inline-block">/</span>
              <span className="text-sm md:text-lg font-medium text-slate-500">{formattedDate}</span>
            </div>
          </div>
          <div className="flex items-center text-xs md:text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium">
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
      
      <JengibreFooter />
    </div>
  );
}