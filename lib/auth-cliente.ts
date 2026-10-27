// Helpers de autenticación para el CLIENTE — login y logout
// Estos métodos usan el cliente de Supabase para navegador y pueden usarse en Client Components ('use client')

import { crearClienteNavegador } from '@/lib/supabase/cliente'

// Tipo para el resultado de operaciones de auth
export interface ResultadoAuth {
  error: string | null
}

// Inicia sesión con email y contraseña
// Usado en FormularioLogin.tsx (Client Component)
export async function login(email: string, password: string): Promise<ResultadoAuth> {
  const supabase = crearClienteNavegador()

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Traducir errores comunes de Supabase Auth al español
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Correo o contraseña incorrectos.' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Debes confirmar tu correo antes de iniciar sesión.' }
      }
      return { error: 'Error al iniciar sesión. Intenta de nuevo.' }
    }

    return { error: null }
  } catch {
    return { error: 'Error de conexión. Verifica tu internet.' }
  }
}

// Cierra la sesión del usuario actual
// Usado en Navbar.tsx (Client Component)
export async function logout(): Promise<ResultadoAuth> {
  const supabase = crearClienteNavegador()

  try {
    const { error } = await supabase.auth.signOut()
    if (error) return { error: 'Error al cerrar sesión. Intenta de nuevo.' }
    return { error: null }
  } catch {
    return { error: 'Error de conexión.' }
  }
}
