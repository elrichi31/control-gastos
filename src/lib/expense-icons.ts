import { Banknote, Bus, CreditCard, Film, HeartPulse, Home, type LucideIcon, ArrowLeftRight, ShoppingCart, Tag, Utensils, Wallet, Zap } from "lucide-react"

const normalize = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const pick = (name: string, rules: [RegExp, LucideIcon][], fallback: LucideIcon) => rules.find(([rule]) => rule.test(normalize(name)))?.[1] ?? fallback

/** Ícono por nombre: las categorías y métodos son del usuario, así que se reconocen por palabra clave. */
export const categoryIcon = (name: string) => pick(name, [
  [/comida|restaur|almuerzo|cafe/, Utensils],
  [/super|mercado|compra/, ShoppingCart],
  [/transporte|auto|gasolina|taxi|bus/, Bus],
  [/salud|medic|farmacia/, HeartPulse],
  [/ocio|entreten|cine|salida/, Film],
  [/casa|hogar|vivienda|alquiler|renta/, Home],
  [/servicio|luz|agua|internet|suscrip/, Zap],
], Tag)

export const paymentIcon = (name: string) => pick(name, [
  [/efectivo|cash/, Banknote],
  [/transfer/, ArrowLeftRight],
  [/credito|debito|tarjeta/, CreditCard],
], Wallet)
