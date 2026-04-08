import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// ── GET /api/clientes/[id] ─────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        obligaciones_fiscales(
          id_obligacion,
          tipo_obligacion,
          periodo_fiscal,
          fecha_vencimiento,
          estatus_cumplimiento,
          monto_estimado
        )
      `)
      .eq('id_cliente', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── PUT /api/clientes/[id] ─────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const body = await request.json()
    const {
      nombre_cliente,
      rfc_cliente,
      regimen_fiscal,
      codigo_postal,
      direccion_fiscal,
      correo_electronico,
      actividad_economica,
      estatus_cliente,
    } = body

    const errors = {}
    if (!nombre_cliente?.trim())  errors.nombre_cliente = 'El nombre es requerido'
    if (!regimen_fiscal?.trim())  errors.regimen_fiscal = 'El régimen es requerido'
    if (!codigo_postal?.trim() || !/^\d{5}$/.test(codigo_postal))
      errors.codigo_postal = 'Código postal inválido'

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }

    const { data, error } = await supabase
      .from('clientes')
      .update({
        nombre_cliente:      nombre_cliente.trim(),
        regimen_fiscal:      regimen_fiscal.trim(),
        codigo_postal:       codigo_postal.trim(),
        direccion_fiscal:    direccion_fiscal?.trim() || null,
        correo_electronico:  correo_electronico?.trim() || null,
        actividad_economica: actividad_economica?.trim() || null,
        estatus_cliente,
      })
      .eq('id_cliente', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Cliente actualizado correctamente' })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── DELETE /api/clientes/[id] ──────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    // Primero eliminar obligaciones relacionadas (CASCADE manual si no está configurado en BD)
    await supabase
      .from('obligaciones_fiscales')
      .delete()
      .eq('id_cliente', params.id)

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id_cliente', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
