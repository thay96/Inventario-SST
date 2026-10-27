import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  ayuda?: string
  id: string
}

export default function Input({ label, error, ayuda, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-texto"
      >
        {label}
        {props.required && <span className="text-alerta ml-1">*</span>}
      </label>
      <input
        id={id}
        className={[
          'w-full border rounded px-3 py-2 text-base text-texto bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primario focus:border-primario',
          'disabled:bg-fondo-secundario disabled:cursor-not-allowed',
          'placeholder:text-texto-secundario',
          error ? 'border-alerta' : 'border-borde',
          className,
        ].join(' ')}
        {...props}
      />
      {ayuda && !error && (
        <span className="text-xs text-texto-secundario">{ayuda}</span>
      )}
      {error && (
        <span className="text-xs text-alerta">{error}</span>
      )}
    </div>
  )
}