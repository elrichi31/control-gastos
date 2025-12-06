import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const anio = searchParams.get('anio');
  const mes = searchParams.get('mes');

  if (!anio || !mes) {
    return NextResponse.json({ error: 'Se requieren los parámetros anio y mes' }, { status: 400 });
  }

  try {
    // Construir las fechas de inicio y fin del mes
    const startDate = `${anio}-${mes.padStart(2, '0')}-01`;
    const nextMonth = parseInt(mes) === 12 ? 1 : parseInt(mes) + 1;
    const nextYear = parseInt(mes) === 12 ? parseInt(anio) + 1 : parseInt(anio);
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    // Contar gastos del mes específico
    const { count, error } = await supabase
      .from('gasto')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('fecha', startDate)
      .lt('fecha', endDate);

    if (error) {
      console.error('Error al contar gastos:', error);
      return NextResponse.json({ error: 'Error al contar los gastos' }, { status: 500 });
    }

    // También obtener el monto total del mes
    const { data: gastosData, error: gastosError } = await supabase
      .from('gasto')
      .select('monto')
      .eq('user_id', userId)
      .gte('fecha', startDate)
      .lt('fecha', endDate);

    if (gastosError) {
      console.error('Error al obtener montos:', gastosError);
      return NextResponse.json({ error: 'Error al obtener los montos' }, { status: 500 });
    }

    const montoTotal = gastosData?.reduce((sum, gasto) => sum + gasto.monto, 0) || 0;

    return NextResponse.json({
      anio: parseInt(anio),
      mes: parseInt(mes),
      cantidad_gastos: count || 0,
      monto_total: montoTotal
    });

  } catch (error) {
    console.error('Error en estadísticas de gastos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
