'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t) }, [onDone])
  return (
    <div className={`toast ${type}`}>
      {type==='success'?'✅':type==='error'?'❌':'⚠️'} {msg}
    </div>
  )
}

function BadgeEstatus({ est }) {
  return (
    <span className={est === 'Activo' ? 'badge badge-green' : 'badge badge-gray'}>
      <span className="dot" /> {est}
    </span>
  )
}

const REGIMENES = [
  'Régimen Simplificado de Confianza (RESICO)',
  'Régimen de Actividades Empresariales',
  'Régimen de Sueldos y Salarios',
  'Régimen de Arrendamiento',
  'Régimen General de Ley (Persona Moral)',
  'Régimen de Incorporación Fiscal (RIF)',
  'Régimen de Plataformas Tecnológicas',
]

// ── Componente principal ───────────────────────────────────────────────────
export default function ClientesPage() {
  const [clientes,  setClientes]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')
  const [toasts,    setToasts]    = useState([])
  const [editId,    setEditId]    = useState(null)
  const [confirm,   setConfirm]   = useState(null)  // { id, nombre }
  const [detail,    setDetail]    = useState(null)

  // Form state
  const BLANK = { nombre_cliente:'', rfc_cliente:'', regimen_fiscal:'', codigo_postal:'', direccion_fiscal:'', correo_electronico:'', actividad_economica:'', estatus_cliente:'Activo' }
  const [form,   setForm]   = useState(BLANK)
  const [errors, setErrors] = useState({})

  // ── Toast ──
  const addToast = (msg, type='success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
  }
  const removeToast = id => setToasts(t => t.filter(x => x.id !== id))

  // ── Fetch clientes ──
  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/clientes?q=${encodeURIComponent(search)}`)
      const json = await res.json()
      setClientes(json.data || [])
    } catch { addToast('Error al cargar clientes', 'error') }
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchClientes, 250)
    return () => clearTimeout(t)
  }, [fetchClientes])

  // ── Guardar (POST o PUT) ──
  async function guardar() {
    setErrors({})
    setSaving(true)
    const method  = editId ? 'PUT'  : 'POST'
    const url     = editId ? `/api/clientes/${editId}` : '/api/clientes'

    const res  = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) {
      if (json.errors) { setErrors(json.errors); return }
      addToast(json.error || 'Error al guardar', 'error'); return
    }
    addToast(json.message, 'success')
    setForm(BLANK)
    setEditId(null)
    fetchClientes()
  }

  // ── Editar ──
  function iniciarEdicion(c) {
    setForm({ nombre_cliente: c.nombre_cliente, rfc_cliente: c.rfc_cliente, regimen_fiscal: c.regimen_fiscal, codigo_postal: c.codigo_postal, direccion_fiscal: c.direccion_fiscal||'', correo_electronico: c.correo_electronico||'', actividad_economica: c.actividad_economica||'', estatus_cliente: c.estatus_cliente })
    setEditId(c.id_cliente)
    setErrors({})
    window.scrollTo({ top: 0, behavior:'smooth' })
  }

  // ── Eliminar ──
  async function eliminar(id) {
    const res  = await fetch(`/api/clientes/${id}`, { method:'DELETE' })
    const json = await res.json()
    setConfirm(null)
    if (!res.ok) { addToast(json.error||'Error al eliminar','error'); return }
    addToast('Cliente eliminado correctamente','warn')
    fetchClientes()
  }

  // ── Ver detalle ──
  async function verDetalle(id) {
    const res  = await fetch(`/api/clientes/${id}`)
    const json = await res.json()
    if (res.ok) setDetail(json.data)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-title">👥 Gestión de Clientes</div>
        <div className="page-sub">Alta, consulta, modificación y baja de clientes fiscales</div>
      </div>

      {/* ─── FORMULARIO ─── */}
      <div className="card">
        <div className="card-header">
          <span>{editId ? '✏️' : '➕'}</span>
          <span className="card-title">{editId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</span>
          {editId && (
            <button className="btn btn-secondary btn-sm" style={{marginLeft:'auto'}} onClick={() => { setForm(BLANK); setEditId(null); setErrors({}) }}>
              ✕ Cancelar edición
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="form-grid">
            {/* Nombre */}
            <div className="form-group">
              <label>Nombre Completo <span className="req">*</span></label>
              <input value={form.nombre_cliente} onChange={e=>f('nombre_cliente',e.target.value)} placeholder="Ej: María López Ramírez" className={errors.nombre_cliente?'err':''} />
              {errors.nombre_cliente && <div className="field-err show">{errors.nombre_cliente}</div>}
            </div>
            {/* RFC */}
            <div className="form-group">
              <label>RFC <span className="req">*</span></label>
              <input value={form.rfc_cliente} onChange={e=>f('rfc_cliente',e.target.value.toUpperCase())} placeholder="Ej: LOPM850312AB3" maxLength={13} className={errors.rfc_cliente?'err':''} disabled={!!editId} />
              {errors.rfc_cliente && <div className="field-err show">{errors.rfc_cliente}</div>}
              {editId && <div style={{fontSize:'.7rem',color:'var(--text3)',marginTop:2}}>El RFC no se puede modificar</div>}
            </div>
            {/* Régimen */}
            <div className="form-group">
              <label>Régimen Fiscal <span className="req">*</span></label>
              <select value={form.regimen_fiscal} onChange={e=>f('regimen_fiscal',e.target.value)} className={errors.regimen_fiscal?'err':''}>
                <option value="">-- Seleccionar --</option>
                {REGIMENES.map(r => <option key={r}>{r}</option>)}
              </select>
              {errors.regimen_fiscal && <div className="field-err show">{errors.regimen_fiscal}</div>}
            </div>
            {/* CP */}
            <div className="form-group">
              <label>Código Postal <span className="req">*</span></label>
              <input value={form.codigo_postal} onChange={e=>f('codigo_postal',e.target.value)} placeholder="64720" maxLength={5} className={errors.codigo_postal?'err':''} />
              {errors.codigo_postal && <div className="field-err show">{errors.codigo_postal}</div>}
            </div>
            {/* Dirección */}
            <div className="form-group full">
              <label>Domicilio Fiscal</label>
              <input value={form.direccion_fiscal} onChange={e=>f('direccion_fiscal',e.target.value)} placeholder="Calle, Número, Colonia, Ciudad, Estado" />
            </div>
            {/* Email */}
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input type="email" value={form.correo_electronico} onChange={e=>f('correo_electronico',e.target.value)} placeholder="cliente@ejemplo.com" />
            </div>
            {/* Actividad */}
            <div className="form-group">
              <label>Actividad Económica</label>
              <input value={form.actividad_economica} onChange={e=>f('actividad_economica',e.target.value)} placeholder="Ej: Venta de bienes raíces" />
            </div>
            {/* Estatus */}
            <div className="form-group">
              <label>Estatus</label>
              <select value={form.estatus_cliente} onChange={e=>f('estatus_cliente',e.target.value)}>
                <option>Activo</option>
                <option>Suspendido</option>
              </select>
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={guardar} disabled={saving}>
              {saving ? <><span className="spinner"></span> Guardando…</> : `💾 ${editId ? 'Actualizar' : 'Registrar'} Cliente`}
            </button>
            {!editId && (
              <button className="btn btn-secondary" onClick={()=>{setForm(BLANK);setErrors({})}}>
                🗑️ Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── TABLA ─── */}
      <div className="card">
        <div className="card-header">
          <span>📋</span>
          <span className="card-title">Clientes Registrados</span>
          <span className="badge badge-blue" style={{marginLeft:8}}>{clientes.length}</span>
          <div className="search-wrap" style={{marginLeft:'auto',maxWidth:260}}>
            <span className="search-icon">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o RFC…" />
          </div>
        </div>
        <div style={{padding:0}}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Nombre</th><th>RFC</th><th>Régimen Fiscal</th>
                  <th>C.P.</th><th>Estatus</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'var(--text3)'}}>Cargando…</td></tr>
                ) : clientes.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon">👤</div>
                      <div className="empty-title">{search ? `Sin resultados para "${search}"` : 'Sin clientes. Registra el primero arriba.'}</div>
                    </div>
                  </td></tr>
                ) : clientes.map(c => (
                  <tr key={c.id_cliente}>
                    <td className="td-mono" style={{color:'var(--text3)'}}>#{c.id_cliente}</td>
                    <td><strong>{c.nombre_cliente}</strong></td>
                    <td className="td-mono">{c.rfc_cliente}</td>
                    <td style={{fontSize:'.76rem',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={c.regimen_fiscal}>{c.regimen_fiscal}</td>
                    <td className="td-mono">{c.codigo_postal}</td>
                    <td><BadgeEstatus est={c.estatus_cliente} /></td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn btn-secondary btn-sm" onClick={()=>verDetalle(c.id_cliente)} title="Ver detalle">👁️</button>
                        <button className="btn btn-secondary btn-sm" onClick={()=>iniciarEdicion(c)} title="Editar">✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>setConfirm({id:c.id_cliente,nombre:c.nombre_cliente})} title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── MODAL CONFIRMAR ─── */}
      {confirm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setConfirm(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">⚠️ Confirmar eliminación</div>
              <button className="modal-close" onClick={()=>setConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{color:'var(--text2)',fontSize:'.85rem',lineHeight:1.6}}>
                ¿Eliminar al cliente <strong>{confirm.nombre}</strong>?<br />
                <span style={{color:'var(--red)',fontSize:'.8rem'}}>⚠️ Se eliminarán también todas sus obligaciones fiscales.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={()=>eliminar(confirm.id)}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DETALLE ─── */}
      {detail && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDetail(null)}>
          <div className="modal" style={{maxWidth:560}}>
            <div className="modal-header">
              <div className="modal-title">👤 {detail.nombre_cliente}</div>
              <button className="modal-close" onClick={()=>setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[
                  ['RFC', detail.rfc_cliente],
                  ['Régimen', detail.regimen_fiscal],
                  ['CP', detail.codigo_postal],
                  ['Estatus', detail.estatus_cliente],
                  ['Correo', detail.correo_electronico||'—'],
                  ['Actividad', detail.actividad_economica||'—'],
                  ['Domicilio', detail.direccion_fiscal||'—'],
                  ['Alta', new Date(detail.created_at).toLocaleDateString('es-MX')],
                ].map(([label,val]) => (
                  <div key={label} style={{background:'var(--surface2)',borderRadius:6,padding:'9px 13px'}}>
                    <div style={{fontSize:'.66rem',textTransform:'uppercase',letterSpacing:'.07em',color:'var(--text3)',marginBottom:2}}>{label}</div>
                    <div style={{fontSize:'.82rem',fontWeight:500}}>{val}</div>
                  </div>
                ))}
              </div>
              {detail.obligaciones_fiscales?.length > 0 && (
                <div style={{marginTop:14}}>
                  <div style={{fontWeight:600,fontSize:'.8rem',marginBottom:8}}>Obligaciones ({detail.obligaciones_fiscales.length})</div>
                  {detail.obligaciones_fiscales.slice(0,4).map(o=>(
                    <div key={o.id_obligacion} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:'.78rem'}}>
                      <span>{o.tipo_obligacion} · {o.periodo_fiscal}</span>
                      <span className={o.estatus_cumplimiento==='Presentada'?'badge badge-green':'badge badge-amber'}>{o.estatus_cumplimiento}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOASTS ─── */}
      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onDone={()=>removeToast(t.id)} />)}
      </div>
    </div>
  )
}
