// Cliente Supabase para uso en el SERVIDOR (Server Components, Server Actions)
// Usar en page.tsx, layout.tsx y funciones que corren en el servidor
// Requiere acceso a las cookies de Next.js para manejar la sesión

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function crearClienteServidor() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        // En Server Components las cookies son de solo lectura.
        // El middleware se encarga de actualizarlas en cada request.
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado: ocurre cuando se llama desde un Server Component
            // donde las cookies no se pueden escribir. El middleware
            // ya manejó el refresco de sesión.
          }
        },
      },
    }
  )
}
