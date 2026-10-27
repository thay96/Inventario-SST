// Helper de autenticación para obtener usuario activo en el servidor
import { crearClienteServidor } from '@/lib/supabase/servidor'

// Obtiene el usuario autenticado desde el servidor
// Usado en Server Components para leer datos del usuario activo
export async function obtenerUsuarioServidor() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
