import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';

export async function checkAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return {
      error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
      user: null
    };
  }

  return {
    error: null,
    user: session.user
  };
}
