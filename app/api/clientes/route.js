import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// ── Validar RFC ────────────────────────────────────────────────────────────
function validarRFC(rfc) {
  // RFC persona física: 13 chars  |  persona moral: 12 chars
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc.toUpperCase())
}
//_________________________________________________________________________________
// ── GET /api/clientes ──────────────────────────────────────────────────────
export async function GET(request) {
  try {
    console.log('=== GET /api/clientes ===')
    
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    
    console.log('Search query:', q)

    let query = supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (q) {
      query = query.or(`nombre_cliente.ilike.%${q}%,rfc_cliente.ilike.%${q}%`)
    }

    console.log('Ejecutando query...')
    const { data, error } = await query

    console.log('Resultado:', { data, error })

    if (error) {
      console.error('ERROR DE SUPABASE:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('ERROR CATCH:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST /api/clientes ─────────────────────────────────────────────────────
export async function POST(request) {
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
      estatus_cliente = 'Activo',
    } = body

    // ── Validaciones ──
    const errors = {}

    if (!nombre_cliente?.trim())
      errors.nombre_cliente = 'El nombre es requerido'

    if (!rfc_cliente?.trim())
      errors.rfc_cliente = 'El RFC es requerido'
    else if (!validarRFC(rfc_cliente))
      errors.rfc_cliente = 'Formato de RFC inválido (12-13 caracteres alfanuméricos)'

    if (!regimen_fiscal?.trim())
      errors.regimen_fiscal = 'El régimen fiscal es requerido'

    if (!codigo_postal?.trim() || !/^\d{5}$/.test(codigo_postal))
      errors.codigo_postal = 'Código postal inválido (5 dígitos)'

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }

    // ── Verificar RFC duplicado ──
    const { data: existente } = await supabase
      .from('clientes')
      .select('id_cliente')
      .eq('rfc_cliente', rfc_cliente.toUpperCase())
      .single()

    if (existente) {
      return NextResponse.json({ errors: { rfc_cliente: 'Este RFC ya está registrado en el sistema' } }, { status: 409 })
    }

    // ── Insertar ──
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nombre_cliente:      nombre_cliente.trim(),
        rfc_cliente:         rfc_cliente.toUpperCase().trim(),
        regimen_fiscal:      regimen_fiscal.trim(),
        codigo_postal:       codigo_postal.trim(),
        direccion_fiscal:    direccion_fiscal?.trim() || null,
        correo_electronico:  correo_electronico?.trim() || null,
        actividad_economica: actividad_economica?.trim() || null,
        estatus_cliente,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Cliente registrado exitosamente' }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
//_________________________________________________________________________________