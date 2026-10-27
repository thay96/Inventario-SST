interface CardProps {
  etiqueta: string
  valor: number | string
  descripcion?: string
  alerta?: boolean
  color?: 'verde' | 'rojo' | 'naranja' | 'neutro'
  resaltado?: boolean
}

const CLASE_COLOR: Record<NonNullable<CardProps['color']>, string> = {
  verde: 'text-[#10B981]',
  rojo: 'text-[#EF4444]',
  naranja: 'text-[#F59E0B]',
  neutro: 'text-texto',
}

export default function Card({
  etiqueta,
  valor,
  descripcion,
  alerta = false,
  color,
  resaltado = false,
}: CardProps) {
  const claseValor = alerta
    ? 'text-alerta'
    : color
    ? CLASE_COLOR[color]
    : 'text-texto'

  return (
    <div
      className={[
        'bg-white border rounded p-5',
        resaltado ? 'border-borde shadow-sm' : 'border-borde',
      ].join(' ')}
    >
      <p className="text-sm text-texto-secundario font-medium uppercase tracking-wide">
        {etiqueta}
      </p>
      <p className={`mt-2 text-3xl font-bold ${claseValor}`}>{valor}</p>
      {descripcion && (
        <p className="mt-1 text-xs text-texto-secundario">{descripcion}</p>
      )}
    </div>
  )
}