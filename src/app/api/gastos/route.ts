import { NextResponse } from 'next/server';
import { normalizeExpenseTags } from '@/lib/expense-tags';
import { getAuthenticatedSupabaseClient } from '@/lib/auth';
import { expenseCreateSchema, expenseUpdateSchema, expenseIdSchema, parseExpenseQueryId } from '@/lib/expense-input';

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
      tags,
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

  const parsed = expenseCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos de gasto inválidos. Revisa monto, fecha, descripción y categorías.' }, { status: 400 });
  const body = parsed.data;
  const { descripcion, monto, fecha, categoria_id, metodo_pago_id, is_recurrent } = body;

  let tags: string[];
  try { tags = normalizeExpenseTags(body.tags); } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
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
      is_recurrent: isRecurrentValue,
      ...(body.tags !== undefined ? { tags } : {})
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

  const raw: unknown = await request.json().catch(() => null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Datos de gasto inválidos.' }, { status: 400 });
  }
  const body = raw as Record<string, unknown>;
  const id = queryId !== null ? parseExpenseQueryId(queryId) : expenseIdSchema.safeParse(body.id).data;
  if (!id || (body.id !== undefined && body.id !== id)) {
    return NextResponse.json({ error: 'ID de gasto inválido o inconsistente.' }, { status: 400 });
  }
  const parsed = expenseUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Campos de gasto inválidos o vacíos.' }, { status: 400 });
  const updates: Record<string, unknown> = { ...parsed.data };
  if (updates.tags !== undefined) {
    try { updates.tags = normalizeExpenseTags(updates.tags); } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  }

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
      tags,
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
  const id = parseExpenseQueryId(searchParams.get('id'));

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
