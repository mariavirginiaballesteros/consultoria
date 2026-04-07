import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logoUrl from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showError("Completa todos los campos");
    
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showError("Credenciales inválidas");
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showError("Error al registrarse: " + error.message);
        setLoading(false);
      } else {
        showSuccess("Cuenta creada exitosamente");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center p-4 selection:bg-[#62BAD3]/30">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <img src={logoUrl} alt="Logo Jengibre" className="h-20 w-20 rounded-2xl shadow-md object-cover border-2 border-[#D9E021] mb-4" />
          <h1 className="text-2xl font-black text-[#2A2B73]">Acceso Consultoría</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Ingresa para continuar</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-600 text-xs uppercase tracking-wide">Email</Label>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" 
              className="h-11 shadow-sm focus-visible:ring-[#62BAD3]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-slate-600 text-xs uppercase tracking-wide">Contraseña</Label>
            <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="h-11 shadow-sm focus-visible:ring-[#62BAD3]"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-11 bg-[#2A2B73] hover:bg-[#1f2055] text-white font-bold shadow-sm"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-[#62BAD3] hover:text-[#4a9bb2] transition-colors"
          >
            {isLogin ? '¿Eres el Administrador? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Entorno seguro protegido por encriptación de extremo a extremo.
          </p>
        </div>
      </div>
    </div>
  );
}