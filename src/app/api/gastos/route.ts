import supabase from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('gasto')
    .select(`
      id,
      descripcion,
      monto,
      fecha,
      categoria_id,
      metodo_pago_id,
      categoria (id, nombre),
      metodo_pago (id, nombre)
    `)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al obtener gastos:', error);
    return NextResponse.json({ error: 'Error al obtener los gastos' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { descripcion, monto, fecha, categoria_id, metodo_pago_id } = body;

  if (!descripcion || !monto || !fecha || !categoria_id || !metodo_pago_id) {
    return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
  }

  const { data, error } = await supabase.from('gasto').insert([
    { descripcion, monto, fecha, categoria_id, metodo_pago_id },
  ]);

  if (error) {
    console.error('Error al insertar gasto:', error);
    return NextResponse.json({ error: 'Error al insertar el gasto' }, { status: 500 });
  }

  return NextResponse.json({ mensaje: 'Gasto creado correctamente', data });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, descripcion, monto, fecha, categoria_id, metodo_pago_id } = body;

  if (!id || !descripcion || !monto || !fecha || !categoria_id || !metodo_pago_id) {
    return NextResponse.json({ error: 'Faltan datos requeridos para la actualización.' }, { status: 400 });
  }

  const { data, error } = await supabase.from('gasto')
    .update({ descripcion, monto, fecha, categoria_id, metodo_pago_id })
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar gasto:', error);
    return NextResponse.json({ error: 'Error al actualizar el gasto' }, { status: 500 });
  }

  return NextResponse.json({ mensaje: 'Gasto actualizado correctamente', data });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID de gasto requerido para eliminar.' }, { status: 400 });
  }

  const { error } = await supabase.from('gasto').delete().eq('id', id);

  if (error) {
    console.error('Error al eliminar gasto:', error);
    return NextResponse.json({ error: 'Error al eliminar el gasto' }, { status: 500 });
  }

  return NextResponse.json({ mensaje: 'Gasto eliminado correctamente' });
}
