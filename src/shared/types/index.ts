// Re-exportar tipos comunes para mantener compatibilidad
export * from "./common"
export * from "./budget"

// Tipos legacy para compatibilidad hacia atrás
export type { GastoCompleto as Expense } from "./common"
