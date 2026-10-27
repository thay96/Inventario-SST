import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Paleta corporativa CONEQUIPOS — no modificar sin autorización
      colors: {
        primario: '#2563EB',       // Azul corporativo
        exito: '#16A34A',          // Verde éxito
        alerta: '#DC2626',         // Rojo alerta
        advertencia: '#D97706',    // Naranja advertencia
        texto: '#1F2937',          // Texto principal
        borde: '#E5E7EB',          // Bordes y divisores
        fondo: '#FFFFFF',          // Fondo base
        'fondo-secundario': '#F9FAFB', // Fondo de filas alternas / cards
        'texto-secundario': '#6B7280', // Texto de apoyo / labels
      },
      fontFamily: {
        // Inter desde Google Fonts, con fallback a system-ui
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Escala tipográfica compacta para UI densa tipo SAP
        'xs': ['11px', '16px'],
        'sm': ['13px', '18px'],
        'base': ['14px', '20px'],
        'lg': ['16px', '22px'],
        'xl': ['18px', '24px'],
        '2xl': ['20px', '28px'],
      },
    },
  },
  plugins: [],
}

export default config
