// Estado de carga global — se muestra mientras los Server Components cargan datos
// Diseño minimalista: solo un indicador de texto, sin spinners ni animaciones

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-fondo">
      <div className="text-center">
        <p className="text-base text-texto font-medium">Cargando...</p>
        <p className="text-sm text-texto-secundario mt-1">
          Por favor espera mientras se carga la información.
        </p>
      </div>
    </div>
  )
}
