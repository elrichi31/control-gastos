import { createServerClient } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('categoria')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener categorías:', error);
    return NextResponse.json({ error: 'Error al obtener las categorías' }, { status: 500 });
  }

  return NextResponse.json(data);
}
