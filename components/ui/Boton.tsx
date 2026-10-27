// Componentes UI base — Botón
// Variantes: primario (azul), secundario (borde gris), peligro (rojo)
// Sin animaciones. Solo cambio de opacidad en hover.

import { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro'
type Tamanio = 'sm' | 'md'

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanio?: Tamanio
  cargando?: boolean
}

const estilosVariante: Record<Variante, string> = {
  primario: 'bg-primario text-white border-primario hover:opacity-90',
  secundario: 'bg-white text-texto border-borde hover:bg-fondo-secundario',
  peligro: 'bg-alerta text-white border-alerta hover:opacity-90',
}

const estilosTamanio: Record<Tamanio, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
}

export default function Boton({
  variante = 'primario',
  tamanio = 'md',
  cargando = false,
  disabled,
  children,
  className = '',
  ...props
}: BotonProps) {
  const estaDeshabilitado = disabled || cargando

  return (
    <button
      disabled={estaDeshabilitado}
      className={[
        'inline-flex items-center justify-center gap-2',
        'border rounded font-medium',
        'focus:outline-none focus:ring-2 focus:ring-primario focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        estilosVariante[variante],
        estilosTamanio[tamanio],
        className,
      ].join(' ')}
      {...props}
    >
      {cargando ? 'Cargando...' : children}
    </button>
  )
}
