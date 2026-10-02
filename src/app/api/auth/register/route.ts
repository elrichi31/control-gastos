import { NextResponse } from 'next/server'

// Provision family accounts administratively in Supabase, never through public signup.
export async function POST() {
  return NextResponse.json({ error: 'El registro público está cerrado. Contacta al administrador.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
}
