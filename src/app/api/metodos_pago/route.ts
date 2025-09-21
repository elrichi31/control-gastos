import { createClient } from '@/lib/database/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('metodo_pago')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener métodos de pago:', error);
    return NextResponse.json({ error: 'Error al obtener los métodos de pago' }, { status: 500 });
  }

  return NextResponse.json(data);
}