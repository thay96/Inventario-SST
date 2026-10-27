// Badge de estado — indica estado de forma visual clara
// Variantes basadas en semáforo: verde (bueno), rojo (malo), gris (pendiente)

type VarianteBadge = 'bueno' | 'malo' | 'pendiente' | 'critico' | 'advertencia'

interface BadgeProps {
  variante: VarianteBadge
  texto: string
}

const estilosBadge: Record<VarianteBadge, string> = {
  bueno: 'bg-green-100 text-exito border-green-200',
  malo: 'bg-red-100 text-alerta border-red-200',
  pendiente: 'bg-gray-100 text-texto-secundario border-gray-200',
  critico: 'bg-red-100 text-alerta border-red-200 font-semibold',
  advertencia: 'bg-amber-100 text-advertencia border-amber-200',
}

export default function Badge({ variante, texto }: BadgeProps) {
  return (
    <span className={[
      'inline-block px-2 py-0.5 text-xs border rounded',
      estilosBadge[variante],
    ].join(' ')}>
      {texto}
    </span>
  )
}
