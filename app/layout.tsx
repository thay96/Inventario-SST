import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SST CONEQUIPOS — Sistema de Inventario',
  description:
    'Sistema de gestión de inventario de seguridad y salud en el trabajo para CONEQUIPOS S.A.S.',
  robots: 'noindex, nofollow', // Sistema interno: no indexar en buscadores
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-fondo text-texto font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
