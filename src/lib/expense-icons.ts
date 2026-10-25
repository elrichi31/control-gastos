import { Banknote, Bus, CreditCard, Film, HeartPulse, Home, type LucideIcon, ArrowLeftRight, Repeat, ShoppingCart, Tag, Utensils, Wallet, Zap } from "lucide-react"
import { getCategoriaColor } from "@/lib/constants"

const normalize = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const pick = (name: string, rules: [RegExp, LucideIcon][], fallback: LucideIcon) => rules.find(([rule]) => rule.test(normalize(name)))?.[1] ?? fallback

/** Ícono por nombre: las categorías y métodos son del usuario, así que se reconocen por palabra clave. */
export const categoryIcon = (name: string) => pick(name, [
  [/suscrip|streaming|netflix|spotify/, Repeat],
  [/comida|alimenta|restaur|almuerzo|cafe/, Utensils],
  [/super|mercado|compra/, ShoppingCart],
  [/transporte|auto|gasolina|taxi|bus/, Bus],
  [/salud|medic|farmacia/, HeartPulse],
  [/ocio|entreten|cine|salida/, Film],
  [/casa|hogar|vivienda|alquiler|renta/, Home],
  [/servicio|luz|agua|internet/, Zap],
], Tag)

export const paymentIcon = (name: string) => pick(name, [
  [/efectivo|cash/, Banknote],
  [/transfer/, ArrowLeftRight],
  [/credito|debito|tarjeta/, CreditCard],
], Wallet)

const TONES = ["text-chart-1", "text-chart-2", "text-chart-3", "text-chart-4", "text-chart-5"]

const TILES: Record<string, string> = { "text-chart-1": "bg-chart-1/10", "text-chart-2": "bg-chart-2/10", "text-chart-3": "bg-chart-3/10", "text-chart-4": "bg-chart-4/10", "text-chart-5": "bg-chart-5/10" }

/** Fondo suave del recuadro que enmarca el ícono de una categoría. */
export const categoryTile = (name?: string | null) => TILES[categoryTone(name)] ?? "bg-muted"

/** Color del ícono de una categoría: el de la paleta de categorías y, si no tiene, uno estable derivado del nombre. */
export function categoryTone(name?: string | null) {
  const known = getCategoriaColor(name).split(" ").find(token => token.startsWith("text-chart"))
  if (known) return known
  if (!name) return "text-muted-foreground"
  let hash = 0
  for (const char of normalize(name)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
}
