import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No auth token')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    // Validar que quien llama esto es un administrador
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('No estás autenticado')
    
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('No tienes permisos de administrador')

    // Usar rol de servicio para crear o actualizar al usuario con altos privilegios
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, clientId } = await req.json()
    
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    console.log("[create-client-user] Buscando perfil para el cliente:", clientId);

    // Verificar si ya existe un perfil vinculado a este cliente usando maybeSingle para evitar errores si no existe
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin.from('profiles')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()

    if (profileCheckError) {
      console.error("[create-client-user] Error al buscar perfil:", profileCheckError);
    }

    if (existingProfile) {
      console.log("[create-client-user] El usuario ya existe. Actualizando contraseña para el perfil:", existingProfile.id);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingProfile.id,
        { password: password }
      )
      if (updateError) throw new Error(updateError.message)
    } else {
      console.log("[create-client-user] Creando nuevo usuario Auth con email:", email);
      
      // 1. Crear usuario en Auth nuevo
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true 
      })
      if (authError) {
        // Si el correo ya existe en auth pero no está vinculado en profiles, forzamos la actualización
        if (authError.message.includes('already registered')) {
          console.log("[create-client-user] El email ya existe en Auth. Intentando recuperarlo y vincularlo.");
          // No podemos buscar por email directamente sin una query compleja, así que lo reportamos al usuario.
          throw new Error('Este cliente parece tener un usuario bloqueado. Elimina el cliente y vuélvelo a crear.');
        }
        throw new Error(authError.message)
      }

      console.log("[create-client-user] Vinculando el nuevo Auth ID al cliente:", clientId);
      // 2. Vincular el perfil creado por el trigger con el ID del cliente
      const { error: profileError } = await supabaseAdmin.from('profiles')
        .update({ client_id: clientId, role: 'client' })
        .eq('id', authData.user.id)
        
      if (profileError) throw new Error(profileError.message)
    }

    console.log("[create-client-user] Proceso finalizado con éxito.");
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("[create-client-user] Error en el proceso:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})