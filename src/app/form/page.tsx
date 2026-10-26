import { redirect } from "next/navigation"

// Compatibility only: expense entry now lives in the shared dialog.
export default async function FormPage({ searchParams }: { searchParams: Promise<{ tipo?: string | string[] }> }) {
  const { tipo } = await searchParams
  redirect(`/dashboard?gasto=${tipo === "recurrente" ? "recurrente" : "normal"}`)
}
