import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

function calcEstatusVisual(fechaStr) {
  const hoy   = new Date(); hoy.setHours(0,0,0,0)
  const fecha = new Date(fechaStr + 'T00:00:00')
  const dias  = Math.round((fecha - hoy) / 86400000)
  if (dias < 0)   return { estatus_visual: 'Vencido',          dias_restantes: dias }
  if (dias <= 30) return { estatus_visual: 'Próximo a vencer', dias_restantes: dias }
  return               { estatus_visual: 'Al día',             dias_restantes: dias }
}

// ── PUT /api/obligaciones/[id] ─────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const body = await request.json()
    const {
      id_cliente,
      tipo_obligacion,
      periodo_fiscal,
      fecha_vencimiento,
      monto_estimado,
      estatus_cumplimiento,
    } = body

    const errors = {}
    if (!tipo_obligacion?.trim())  errors.tipo_obligacion  = 'Tipo requerido'
    if (!periodo_fiscal?.trim())   errors.periodo_fiscal   = 'Periodo requerido'
    if (!fecha_vencimiento)        errors.fecha_vencimiento = 'Fecha requerida'

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }

    const { estatus_visual, dias_restantes } = calcEstatusVisual(fecha_vencimiento)

    const { data, error } = await supabase
      .from('obligaciones_fiscales')
      .update({
        id_cliente:           parseInt(id_cliente),
        tipo_obligacion:      tipo_obligacion.trim(),
        periodo_fiscal:       periodo_fiscal.trim(),
        fecha_vencimiento,
        monto_estimado:       parseFloat(monto_estimado) || 0,
        estatus_cumplimiento,
        estatus_visual,
        dias_restantes,
      })
      .eq('id_obligacion', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Obligación actualizada correctamente' })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── DELETE /api/obligaciones/[id] ─────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const { error } = await supabase
      .from('obligaciones_fiscales')
      .delete()
      .eq('id_obligacion', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Obligación eliminada correctamente' })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
