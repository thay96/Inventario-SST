/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tipado estricto
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // Imágenes: dominio de Supabase Storage para fotos de extintores (futuro)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig