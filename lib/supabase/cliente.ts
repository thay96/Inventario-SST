// Cliente Supabase para uso en el NAVEGADOR (Client Components)
// Usar en componentes con 'use client', formularios y eventos de usuario

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
