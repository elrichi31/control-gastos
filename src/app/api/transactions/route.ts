import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Ruta al archivo JSON que contiene los datos
    const filePath = path.join(process.cwd(), 'data', './transactions.json'); // Asegúrate de colocar el archivo JSON en esta carpeta

    // Verifica si el archivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'El archivo de transacciones no existe' }, { status: 404 });
    }

    // Lee y parsea el archivo JSON
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const transactions = JSON.parse(fileContents);

    // Responde con las transacciones
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error al leer las transacciones:', error);
    return NextResponse.json({ error: 'Hubo un error al procesar la solicitud' }, { status: 500 });
  }
}
