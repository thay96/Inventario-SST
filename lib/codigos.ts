// Helpers de generación de códigos (puro, sin acceso a BD)

export function prefijoCategoria(nombre: string): string {
  const n = nombre.toUpperCase()
  if (n.includes('EPP')) return 'EPP'
  if (n.includes('DOTACION') || n.includes('DOTACIÓN')) return 'DOT'
  if (n.includes('EXTINTOR')) return 'EXT'
  if (n.includes('EMERGENCIA')) return 'EMERG'
  return n.replace(/[^A-Z]/g, '').slice(0, 3) || 'PROD'
}