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
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F8]">
        <Loader2 className="h-10 w-10 animate-spin text-[#D9E021]" />
      </div>
    );
  }

  if (!client) {
    return <div className="min-h-screen p-10 text-center text-slate-600 font-medium">Este enlace no es válido o el cliente fue eliminado.</div>;
  }

  const dateStr = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 flex flex-col font-sans selection:bg-[#62BAD3]/30">
      <div className="max-w-[1200px] mx-auto px-4 pt-8 flex-1 w-full">
        
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center bg-[#2A2B73] p-6 md:p-8 rounded-2xl shadow-xl border-b-4 border-[#D9E021] mb-8 gap-4 overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#E32462] rounded-full blur-[80px] opacity-20"></div>
          
          <div className="relative z-10 flex items-center gap-5">
            <img src={logoUrl} alt="Jengibre Logo" className="h-16 w-16 rounded-2xl shadow-lg object-cover border-2 border-[#D9E021]" />
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {client.name}
              </h1>
              <span className="text-base font-bold text-[#62BAD3]">{formattedDate}</span>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center text-xs md:text-sm text-[#2A2B73] bg-[#D9E021] px-4 py-2 rounded-full font-bold shadow-sm">
            <span className="relative flex h-2.5 w-2.5 mr-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
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