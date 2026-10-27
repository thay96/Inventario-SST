// Select con label y mensaje de error
// Acepta cualquier lista de opciones como { valor, etiqueta }

import { SelectHTMLAttributes } from 'react'

interface Opcion {
  valor: string | number
  etiqueta: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  opciones: Opcion[]
  error?: string
  id: string
  placeholder?: string
}

export default function Select({
  label,
  opciones,
  error,
  id,
  placeholder,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-texto"
      >
        {label}
        {props.required && <span className="text-alerta ml-1">*</span>}
      </label>
      <select
        id={id}
        className={[
          'w-full border rounded px-3 py-2 text-base text-texto bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primario focus:border-primario',
          'disabled:bg-fondo-secundario disabled:cursor-not-allowed',
          error ? 'border-alerta' : 'border-borde',
          className,
        ].join(' ')}
        {...props}
      >
        {placeholder && (
          <option value="">-- {placeholder} --</option>
        )}
        {opciones.map((op) => (
          <option key={op.valor} value={op.valor}>
            {op.etiqueta}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-alerta">{error}</span>
      )}
    </div>
  )
}
