'use client'

// Formulario de login con validación de cliente básica
// Usa Supabase Auth. En caso de error muestra mensaje descriptivo.

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth-cliente'
import Input from '@/components/ui/Input'
import Boton from '@/components/ui/Boton'
import MensajeError from '@/components/ui/MensajeError'

export default function FormularioLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validación básica del cliente
    if (!email.trim()) {
      setError('El correo es obligatorio.')
      return
    }
    if (!password) {
      setError('La contraseña es obligatoria.')
      return
    }

    setCargando(true)

    const resultado = await login(email.trim(), password)

    if (resultado.error) {
      setError(resultado.error)
      setCargando(false)
      return
    }

    // Redirigir al dashboard después de login exitoso
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      <MensajeError mensaje={error} />

      <Input
        id="email"
        type="email"
        label="Correo electrónico"
        placeholder="usuario@conequipos.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />

      <Input
        id="password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      <Boton
        type="submit"
        variante="primario"
        cargando={cargando}
        className="w-full mt-2"
      >
        Ingresar al sistema
      </Boton>
    </form>
  )
}
