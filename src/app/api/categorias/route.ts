import { createClient } from '@/shared/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

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