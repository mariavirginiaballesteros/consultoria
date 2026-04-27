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
    if (!authHeader) throw new Error('No se recibió el token de autenticación del administrador')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    // 1. Validar que quien llama esto es un administrador real
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('No estás autenticado en el sistema')
    
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('No tienes permisos de administrador para realizar esta acción')

    // 2. Preparar el cliente con privilegios máximos (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, clientId } = await req.json()
    
    if (!password || password.length < 6) {
      throw new Error('La contraseña de acceso debe tener al menos 6 caracteres')
    }

    console.log(`[create-client-user] Iniciando proceso para cliente: ${clientId} | Email: ${email}`);
    let authUserId = null;

    // 3. Intentar crear el usuario directamente
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true 
    })

    if (authError) {
      console.log("[create-client-user] Error al crear (posiblemente ya existe):", authError.message);
      
      // Si el error es porque ya existe, lo buscamos y actualizamos
      if (authError.message.includes('already registered') || authError.status === 422) {
        console.log("[create-client-user] Buscando usuario existente para forzar actualización...");
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) throw new Error('Error al buscar el usuario trabado: ' + listError.message);
        
        const existingUser = usersData.users.find(u => u.email === email);
        if (!existingUser) {
          throw new Error('Inconsistencia en Supabase: El email dice estar registrado pero no aparece en la lista.');
        }
        
        authUserId = existingUser.id;
        console.log("[create-client-user] Usuario encontrado. Actualizando contraseña. ID:", authUserId);
        
        // Forzamos la actualización de la contraseña
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
        if (updateAuthError) throw new Error('Error al forzar nueva contraseña: ' + updateAuthError.message);
      } else {
        throw new Error('Error de Supabase Auth: ' + authError.message);
      }
    } else {
      authUserId = authData.user.id;
      console.log("[create-client-user] Usuario nuevo creado correctamente. ID:", authUserId);
    }

    // 4. Asegurarnos que el perfil (creado por el trigger de Supabase) quede bien vinculado al cliente
    console.log("[create-client-user] Vinculando perfil al client_id:", clientId);
    const { error: profileError } = await supabaseAdmin.from('profiles')
      .update({ client_id: clientId, role: 'client' })
      .eq('id', authUserId);
      
    if (profileError) {
      throw new Error('El usuario se creó, pero falló la vinculación con la empresa: ' + profileError.message);
    }

    console.log("[create-client-user] Proceso exitoso completado.");
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("[create-client-user] Error capturado:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Forzamos un status 400 para que el cliente lo detecte fácilmente
    })
  }
})