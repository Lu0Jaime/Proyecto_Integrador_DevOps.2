import './globals.css'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const metadata = {
  title: 'Cartera Fiscal | Sistema de Gestión',
  description: 'Sistema de Gestión de Cartera Fiscal de Clientes - Tecmilenio DevOps',
}

async function getAlertCount() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const in30  = new Date(Date.now() + 30*86400000).toISOString().split('T')[0]
    const { count } = await supabase
      .from('obligaciones_fiscales')
      .select('*', { count: 'exact', head: true })
      .eq('estatus_cumplimiento', 'Pendiente')
      .lte('fecha_vencimiento', in30)
    return count || 0
  } catch { return 0 }
}

export default async function RootLayout({ children }) {
  const alertCount = await getAlertCount()

  return (
    <html lang="es">
      <body>
        {/* ── Header ── */}
        <header className="header">
          <Link href="/" className="header-logo">
            Fiscallet <span>| CarteraFiscal </span>
          </Link>
          <nav className="header-nav">
            <Link href="/">Dashboard</Link>
            <Link href="/clientes">Clientes</Link>
            <Link href="/obligaciones">Obligaciones</Link>
          </nav>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'})}</span>
          </div>
        </header>

        {/* ── Alert Banner ── */}
        {alertCount > 0 && (
          <div className="alert-banner">
            ⚠️ &nbsp;Hay{' '}
            <span className="alert-count">{alertCount}</span>{' '}
            obligaciones próximas a vencer o vencidas que requieren atención.
            <Link href="/obligaciones">Ver alertas →</Link>
          </div>
        )}

        {/* ── Main content ── */}
        <main>{children}</main>

        {/* ── Toast container (portada) ── */}
        <div id="toast-root" />
      </body>
    </html>
  )
}
