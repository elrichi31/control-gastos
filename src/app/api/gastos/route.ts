import { NextResponse } from 'next/server';
import { normalizeExpenseTags } from '@/lib/expense-tags';
import { getAuthenticatedSupabaseClient } from '@/lib/auth';
import { expenseCreateSchema, expenseUpdateSchema, expenseIdSchema, parseExpenseQueryId } from '@/lib/expense-input';
import { computeForeignTax, foreignTaxFromStored, isMissingColumnError, parseStoredForeignTax, type StoredForeignTax } from '@/lib/foreign-tax';

const EXPENSE_COLUMNS = `
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
      metodo_pago (id, nombre)`;
// Sin la migración 20261015 la columna no existe: se reintenta sin ella en vez de romper la app.
const columns = (withTax: boolean) => withTax ? `${EXPENSE_COLUMNS}, impuesto_exterior` : EXPENSE_COLUMNS;
const omitTax = <T extends Record<string, unknown>>(row: T) => { const copy: Record<string, unknown> = { ...row }; delete copy.impuesto_exterior; return copy as T };

/** undefined: no viene; null: quitarla; objeto válido; 'invalid' si no se puede guardar. */
function readForeignTax(value: unknown): StoredForeignTax | null | undefined | 'invalid' {
  if (value === undefined || value === null) return value;
  return parseStoredForeignTax(value) ?? 'invalid';
}

export async function GET(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request);
  if (authError) return authError;

  const list = (withTax: boolean) => supabase.from('gasto').select(columns(withTax)).eq('user_id', userId).order('fecha', { ascending: false });
  let { data, error } = await list(true);
  if (isMissingColumnError(error)) ({ data, error } = await list(false));

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
  const { descripcion, fecha, categoria_id, metodo_pago_id, is_recurrent } = body;
  const foreignTax = readForeignTax(body.impuesto_exterior);
  if (foreignTax === 'invalid') return NextResponse.json({ error: 'Revisa los impuestos de la compra en el exterior.' }, { status: 400 });
  // Con compra en el exterior el total lo calcula el servidor desde el precio original.
  const monto = foreignTax ? computeForeignTax(foreignTax.base, foreignTaxFromStored(foreignTax)).total : body.monto;

  let tags: string[];
  try { tags = normalizeExpenseTags(body.tags); } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  // Asegurar que is_recurrent siempre sea un booleano
  const isRecurrentValue = typeof is_recurrent === 'boolean' ? is_recurrent : false;

  const row = {
    descripcion,
    monto,
    fecha,
    categoria_id,
    metodo_pago_id,
    user_id: userId,
    is_recurrent: isRecurrentValue,
    ...(body.tags !== undefined ? { tags } : {}),
    ...(foreignTax ? { impuesto_exterior: foreignTax } : {}),
  };
  const insert = (values: Record<string, unknown>) => supabase.from('gasto').insert([values]).select().single();
  let { data, error } = await insert(row);
  if (foreignTax && isMissingColumnError(error)) ({ data, error } = await insert(omitTax(row)));

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
  const foreignTax = readForeignTax(updates.impuesto_exterior);
  if (foreignTax === 'invalid') return NextResponse.json({ error: 'Revisa los impuestos de la compra en el exterior.' }, { status: 400 });
  if (foreignTax !== undefined) updates.impuesto_exterior = foreignTax;
  if (foreignTax) updates.monto = computeForeignTax(foreignTax.base, foreignTaxFromStored(foreignTax)).total;
  if (updates.tags !== undefined) {
    try { updates.tags = normalizeExpenseTags(updates.tags); } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar.' }, { status: 400 });
  }

  const update = (values: Record<string, unknown>, withTax: boolean) => supabase.from('gasto')
    .update(values)
    .eq('id', id)
    .eq('user_id', userId)
    .select(columns(withTax))
    .single();
  let { data, error } = await update(updates, true);
  if (isMissingColumnError(error)) {
    const rest = omitTax(updates);
    ({ data, error } = Object.keys(rest).length ? await update(rest, false) : await supabase.from('gasto').select(columns(false)).eq('id', id).eq('user_id', userId).single());
  }

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
