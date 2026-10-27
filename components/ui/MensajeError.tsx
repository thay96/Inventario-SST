// Mensaje de error global — para mostrar errores de operaciones
// Se usa cuando una acción falla (guardar, cargar datos, etc.)

interface MensajeErrorProps {
  mensaje: string | null
}

export default function MensajeError({ mensaje }: MensajeErrorProps) {
  if (!mensaje) return null

  return (
    <div
      role="alert"
      className="w-full border border-red-200 bg-red-50 rounded px-4 py-3"
    >
      <p className="text-sm text-alerta font-medium">{mensaje}</p>
    </div>
  )
}
