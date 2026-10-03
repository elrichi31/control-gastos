import { createServiceClient } from '@/lib/database/service';
import { NextResponse } from 'next/server';

export async function GET() {
  // Shared public catalog, read with the service role because the table is closed to anon.
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Falta configurar el acceso privado a Supabase' }, { status: 503 });

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
