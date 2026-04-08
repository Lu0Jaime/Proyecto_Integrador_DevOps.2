import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// ── Calcular estatus visual (lógica de negocio del servidor) ───────────────
function calcEstatusVisual(fechaStr) {
  const hoy   = new Date(); hoy.setHours(0,0,0,0)
  const fecha = new Date(fechaStr + 'T00:00:00')
  const dias  = Math.round((fecha - hoy) / 86400000)
  if (dias < 0)   return { estatus_visual: 'Vencido',          dias_restantes: dias }
  if (dias <= 30) return { estatus_visual: 'Próximo a vencer', dias_restantes: dias }
  return               { estatus_visual: 'Al día',             dias_restantes: dias }
}

// ── GET /api/obligaciones ──────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q       = searchParams.get('q')       || ''
    const estatus = searchParams.get('estatus') || ''   // visual
    const cumpl   = searchParams.get('cumpl')   || ''   // Pendiente/Presentada

    let query = supabase
      .from('obligaciones_fiscales')
      .select(`
        id_obligacion,
        id_cliente,
        tipo_obligacion,
        periodo_fiscal,
        fecha_vencimiento,
        monto_estimado,
        estatus_cumplimiento,
        created_at,
        clientes(nombre_cliente, rfc_cliente, estatus_cliente)
      `)
      .order('fecha_vencimiento', { ascending: true })

    if (cumpl)  query = query.eq('estatus_cumplimiento', cumpl)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Enriquecer con cálculo de días y estatus visual (procesamiento de datos) ──
    let enriched = (data || []).map(o => {
      const calc = calcEstatusVisual(o.fecha_vencimiento)
      return { ...o, ...calc }
    })

    // Filtrar por búsqueda
    if (q) {
      const ql = q.toLowerCase()
      enriched = enriched.filter(o =>
        o.clientes?.nombre_cliente?.toLowerCase().includes(ql) ||
        o.clientes?.rfc_cliente?.toLowerCase().includes(ql)   ||
        o.tipo_obligacion?.toLowerCase().includes(ql)
      )
    }

    // Filtrar por estatus visual
    if (estatus) {
      enriched = enriched.filter(o => o.estatus_visual === estatus)
    }

    return NextResponse.json({ data: enriched })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST /api/obligaciones ─────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      id_cliente,
      tipo_obligacion,
      periodo_fiscal,
      fecha_vencimiento,
      monto_estimado = 0,
      estatus_cumplimiento = 'Pendiente',
    } = body

    // ── Validaciones ──
    const errors = {}
    if (!id_cliente)            errors.id_cliente        = 'El cliente es requerido'
    if (!tipo_obligacion?.trim()) errors.tipo_obligacion = 'El tipo de obligación es requerido'
    if (!periodo_fiscal?.trim())  errors.periodo_fiscal  = 'El periodo fiscal es requerido'
    if (!fecha_vencimiento)       errors.fecha_vencimiento = 'La fecha de vencimiento es requerida'

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }

    // ── Verificar que el cliente exista ──
    const { data: clienteExiste } = await supabase
      .from('clientes')
      .select('id_cliente')
      .eq('id_cliente', id_cliente)
      .single()

    if (!clienteExiste) {
      return NextResponse.json({ errors: { id_cliente: 'El cliente seleccionado no existe' } }, { status: 404 })
    }

    // ── Calcular estatus visual automáticamente ──
    const { estatus_visual, dias_restantes } = calcEstatusVisual(fecha_vencimiento)

    // ── Insertar ──
    const { data, error } = await supabase
      .from('obligaciones_fiscales')
      .insert({
        id_cliente:           parseInt(id_cliente),
        tipo_obligacion:      tipo_obligacion.trim(),
        periodo_fiscal:       periodo_fiscal.trim(),
        fecha_vencimiento,
        monto_estimado:       parseFloat(monto_estimado) || 0,
        estatus_cumplimiento,
        estatus_visual,
        dias_restantes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: { ...data, estatus_visual, dias_restantes },
      message: 'Obligación registrada exitosamente'
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
