import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Paso 1: Crear una respuesta mutable para que Supabase pueda
  // escribir las cookies de sesión actualizadas en la respuesta.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
   
  // Paso 2: Crear el cliente de Supabase para el servidor con acceso
  // a las cookies de la petición actual. Esto es necesario para que
  // el token JWT se refresque automáticamente en cada request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Leer cookies de la petición entrante
        getAll() {
          return request.cookies.getAll()
        },
        // Escribir cookies actualizadas tanto en el request como en
        // la respuesta para que sean visibles en Server Components
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Paso 3: Refrescar la sesión del usuario. Esta llamada es
  // obligatoria en el middleware para que los Server Components
  // puedan acceder a la sesión actualizada.
  // IMPORTANTE: getUser() valida el token con Supabase Auth,
  // evitando que tokens expirados o manipulados pasen al servidor.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ruta = request.nextUrl.pathname

  // Paso 4: Rutas protegidas — si no hay sesión activa, redirigir a /login
  const rutasProtegidas = ['/dashboard', '/inventario', '/inspecciones', '/reportes']
  const esRutaProtegida = rutasProtegidas.some((r) => ruta.startsWith(r))

  if (!user && esRutaProtegida) {
    // Guardar la URL original para redirigir después del login (futuro)
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Paso 5: Si el usuario ya está autenticado y visita /login,
  // redirigir al dashboard para evitar mostrar el login innecesariamente.
  if (user && ruta === '/login') {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Paso 6: En cualquier otro caso, continuar con la respuesta normal
  // que ya tiene las cookies de sesión actualizadas.
  return response
}

// Configuración del matcher: el middleware SOLO se ejecuta en rutas
// de la aplicación. Se excluyen assets estáticos, imágenes y API routes
// que no necesitan validación de sesión.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
