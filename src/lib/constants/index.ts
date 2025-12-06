// Constants exports
export * from './app'
export * from './budget'

// Re-export specific items for backward compatibility
export { 
  allMonths, 
  type MonthData,
  type PresupuestoCategoriaDetalle,
  type CategoriaDB,
  type MetodoPagoDB,
  type MovimientoPresupuesto,
  type PresupuestoInfo,
  type ExpenseFormData,
  type EditingExpense,
  type ExpenseToDelete
} from './budget'
