import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import logoUrl from "@/assets/logo.jpg";

export default function Login() {
  return (
    <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center p-4 selection:bg-[#62BAD3]/30">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <img src={logoUrl} alt="Logo Jengibre" className="h-20 w-20 rounded-2xl shadow-md object-cover border-2 border-[#D9E021] mb-4" />
          <h1 className="text-2xl font-black text-[#2A2B73]">Acceso Consultoría</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Ingresa para continuar</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2A2B73',
                  brandAccent: '#1f2055',
                  inputText: '#334155',
                  inputBorder: '#e2e8f0',
                },
                borderWidths: {
                  buttonBorderWidth: '0px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '0.5rem',
                  buttonBorderRadius: '0.5rem',
                  inputBorderRadius: '0.5rem',
                },
              }
            },
            className: {
              button: 'font-bold shadow-sm',
              label: 'font-bold text-slate-600 text-xs uppercase tracking-wide',
              input: 'h-11 shadow-sm'
            }
          }}
          theme="light"
        />
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Entorno seguro protegido por encriptación de extremo a extremo.
          </p>
        </div>
      </div>
    </div>
  );
}