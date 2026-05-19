import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request);
  if (authError) return authError;

  const { data, error } = await supabase
    .from('gasto')
    .select(`
      id,
      descripcion,
      monto,
      fecha,
      categoria_id,
      metodo_pago_id,
      user_id,
      is_recurrent,
      categoria (id, nombre),
      metodo_pago (id, nombre)
    `)
    .eq('user_id', userId)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al obtener gastos:', error);
    return NextResponse.json({ error: 'Error al obtener los gastos' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request);
  if (authError) return authError;

  const body = await request.json();
  const { descripcion, monto, fecha, categoria_id, metodo_pago_id, is_recurrent } = body;

  if (!descripcion || !monto || !fecha || !categoria_id || !metodo_pago_id) {
    return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
  }

  // Asegurar que is_recurrent siempre sea un booleano
  const isRecurrentValue = typeof is_recurrent === 'boolean' ? is_recurrent : false;

  const { data, error } = await supabase.from('gasto').insert([
    { 
      descripcion, 
      monto, 
      fecha, 
      categoria_id, 
      metodo_pago_id,
      user_id: userId,
      is_recurrent: isRecurrentValue
    },
  ])
  .select()
  .single();

  if (error) {
    console.error('❌ Error al insertar gasto:', error);
    return NextResponse.json({ error: 'Error al insertar el gasto' }, { status: 500 });
  }

  return NextResponse.json({ mensaje: 'Gasto creado correctamente', data });
}

export async function PUT(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get('id');

  const body = await request.json();
  const { id: bodyId, descripcion, monto, fecha, categoria_id, metodo_pago_id, is_recurrent } = body;

  const id = queryId ?? bodyId;

  if (!id) {
    return NextResponse.json({ error: 'ID de gasto requerido para actualizar.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (descripcion !== undefined) updates.descripcion = descripcion;
  if (monto !== undefined) updates.monto = monto;
  if (fecha !== undefined) updates.fecha = fecha;
  if (categoria_id !== undefined) updates.categoria_id = categoria_id;
  if (metodo_pago_id !== undefined) updates.metodo_pago_id = metodo_pago_id;
  if (typeof is_recurrent === 'boolean') updates.is_recurrent = is_recurrent;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar.' }, { status: 400 });
  }

  const { data, error } = await supabase.from('gasto')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select(`
      id,
      descripcion,
      monto,
      fecha,
      categoria_id,
      metodo_pago_id,
      user_id,
      is_recurrent,
      categoria (id, nombre),
      metodo_pago (id, nombre)
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Gasto no encontrado.' }, { status: 404 });
    }
    console.error('Error al actualizar gasto:', error);
    return NextResponse.json({ error: 'Error al actualizar el gasto' }, { status: 500 });
  }

  return NextResponse.json({ mensaje: 'Gasto actualizado correctamente', data });
}

export async function DELETE(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID de gasto requerido para eliminar.' }, { status: 400 });
  }

  const { error } = await supabase.from('gasto')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error al eliminar gasto:', error);
    return NextResponse.json({ error: 'Error al eliminar el gasto' }, { status: 500 });
  }

  return NextResponse.json({ mensaje: 'Gasto eliminado correctamente' });
}
