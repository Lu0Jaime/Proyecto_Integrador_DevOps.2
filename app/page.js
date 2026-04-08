import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// ── Helpers ────────────────────────────────────────────────────────────────
function calcEstatus(fechaStr) {
  const hoy  = new Date(); hoy.setHours(0,0,0,0)
  const fecha = new Date(fechaStr + 'T00:00:00')
  const dias  = Math.round((fecha - hoy) / 86400000)
  if (dias < 0)   return { label: 'Vencido',          dias, color: '#dc2626' }
  if (dias <= 30) return { label: 'Próximo a vencer', dias, color: '#b45309' }
  return               { label: 'Al día',             dias, color: '#0f5f3e' }
}

function BadgeEV({ label }) {
  const map = {
    'Vencido':          'badge badge-red',
    'Próximo a vencer': 'badge badge-amber',
    'Al día':           'badge badge-green',
  }
  const ico = { 'Vencido':'🔴', 'Próximo a vencer':'⚠️', 'Al día':'✅' }
  return <span className={map[label]}>{ico[label]} {label}</span>
}

// ── Data fetching ──────────────────────────────────────────────────────────
async function getDashboardData() {
  try {
    const [{ count: nClientes }, { count: nObligs }, { data: obligs }] = await Promise.all([
      supabase.from('clientes').select('*', { count:'exact', head:true }),
      supabase.from('obligaciones_fiscales').select('*', { count:'exact', head:true }),
      supabase
        .from('obligaciones_fiscales')
        .select('*, clientes(nombre_cliente, rfc_cliente)')
        .eq('estatus_cumplimiento','Pendiente')
        .order('fecha_vencimiento', { ascending: true })
        .limit(20),
    ])

    const alerts = (obligs || [])
      .map(o => ({ ...o, _ev: calcEstatus(o.fecha_vencimiento) }))
      .filter(o => o._ev.label !== 'Al día')
      .slice(0,6)

    const proximas = alerts.filter(a => a._ev.label === 'Próximo a vencer').length
    const vencidas  = alerts.filter(a => a._ev.label === 'Vencido').length

    return { nClientes: nClientes || 0, nObligs: nObligs || 0, proximas, vencidas, alerts }
  } catch {
    return { nClientes: 0, nObligs: 0, proximas: 0, vencidas: 0, alerts: [] }
  }
}

async function getClientesRecientes() {
  try {
    const { data } = await supabase
      .from('clientes')
      .select('id_cliente, nombre_cliente, rfc_cliente, estatus_cliente, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    return data || []
  } catch { return [] }
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const [dash, recientes] = await Promise.all([getDashboardData(), getClientesRecientes()])

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-title">📊 Dashboard</div>
        <div className="page-sub">
          Sistema de Gestión de Cartera Fiscal de Clientes — Resumen general
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Clientes</div>
          <div className="stat-value green">{dash.nClientes}</div>
          <div className="stat-desc">Registrados en el sistema</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Obligaciones</div>
          <div className="stat-value blue">{dash.nObligs}</div>
          <div className="stat-desc">Registradas en la BD</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Próximos a Vencer</div>
          <div className="stat-value amber">{dash.proximas}</div>
          <div className="stat-desc">En los próximos 30 días</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vencidas</div>
          <div className="stat-value red">{dash.vencidas}</div>
          <div className="stat-desc">Requieren atención urgente</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Alertas */}
        <div className="card">
          <div className="card-header">
            <span>🔔</span>
            <span className="card-title">Alertas de Vencimiento</span>
            <Link href="/obligaciones" className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }}>Ver todas</Link>
          </div>
          <div style={{ padding: 0 }}>
            {dash.alerts.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">✅</div>
                <div className="empty-title">Sin alertas pendientes</div>
                <div className="empty-sub">Todas las obligaciones están al día</div>
              </div>
            ) : dash.alerts.map(o => (
              <div key={o.id_obligacion} style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
                <BadgeEV label={o._ev.label} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.82rem', fontWeight:500 }}>{o.clientes?.nombre_cliente || '—'}</div>
                  <div style={{ fontSize:'.7rem', color:'var(--text3)' }}>{o.tipo_obligacion} · Vence: {o.fecha_vencimiento}</div>
                </div>
                <span style={{ fontFamily:'var(--mono)', fontSize:'.78rem', fontWeight:600, color: o._ev.color }}>
                  {o._ev.dias < 0 ? `${o._ev.dias}d` : `+${o._ev.dias}d`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Clientes recientes */}
        <div className="card">
          <div className="card-header">
            <span>👥</span>
            <span className="card-title">Clientes Recientes</span>
            <Link href="/clientes" className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }}>Ver todos</Link>
          </div>
          <div style={{ padding: 0 }}>
            {recientes.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">👤</div>
                <div className="empty-title">Sin clientes registrados</div>
                <div className="empty-sub">Registra tu primer cliente</div>
              </div>
            ) : recientes.map(c => (
              <div key={c.id_cliente} style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', color:'var(--primary)', fontWeight:700, flexShrink:0 }}>
                  {c.nombre_cliente[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.82rem', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nombre_cliente}</div>
                  <div style={{ fontSize:'.7rem', color:'var(--text3)', fontFamily:'var(--mono)' }}>{c.rfc_cliente}</div>
                </div>
                <span className={c.estatus_cliente === 'Activo' ? 'badge badge-green' : 'badge badge-gray'}>
                  <span className="dot" /> {c.estatus_cliente}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
