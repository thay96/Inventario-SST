import { redirect } from 'next/navigation'
import { obtenerUsuarioServidor } from '@/lib/auth'

// Ruta raíz: redirige según el estado de autenticación
// Si está logueado → dashboard. Si no → login.
export default async function HomePage() {
  const usuario = await obtenerUsuarioServidor()

  if (usuario) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
