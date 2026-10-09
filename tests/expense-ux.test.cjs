require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const {renderToStaticMarkup}=require('react-dom/server')
const Module=require('node:module')
const original=Module._load
Module._load=function(name,...args){ if(name.startsWith('@/services/'))return {fetchCategories:async()=>[],fetchPaymentMethods:async()=>[],createExpense:async()=>{},fetchExpenses:async()=>[]};return original.call(this,name,...args) }
const {ExpenseForm}=require('../src/components/gastos/ExpenseForm.tsx')
Module._load=original
const {FiltrosGastos}=require('../src/components/detalle-gastos/FiltrosGastos.tsx')
const {ListaGastosAgrupados}=require('../src/components/detalle-gastos/ListaGastosAgrupados.tsx')
const {GastoCard}=require('../src/components/detalle-gastos/GastoCard.tsx')
const defaults={search:'',category:'',paymentMethod:'',dateRange:'current-month',year:'',dateFrom:'',dateTo:'',minAmount:'',maxAmount:'',sortBy:'date',sortOrder:'desc',groupBy:'none'}
const noop=()=>{}
const render=(c,p)=>renderToStaticMarkup(React.createElement(c,p))
test('capture starts with amount and exposes decimal keyboard, accessible errors and repeat-save action',()=>{
 const html=render(ExpenseForm,{fetchExpenses:noop})
 assert.ok(html.indexOf('id="amount"')<html.indexOf('id="description"'))
 assert.match(html,/inputMode="decimal"|inputmode="decimal"/)
 assert.match(html,/Guardar y agregar otro/)
 assert.match(html,/aria-invalid="false"/)
 assert.match(html,/<fieldset/)
})
test('custom dates are visible immediately without expanding advanced filters',()=>{
 const html=render(FiltrosGastos,{filters:{...defaults,dateRange:'custom'},onFilterChange:noop,onClearFilters:noop,categories:[],paymentMethods:[],activeFiltersCount:1,showAdvancedFilters:false,setShowAdvancedFilters:noop})
 assert.match(html,/Fecha desde/);assert.match(html,/Fecha hasta/)
 assert.match(html,/aria-label="Buscar gastos"/)
 assert.match(html,/aria-expanded="false"/)
})
test('active category and search expose separately removable filter controls',()=>{
 const html=render(FiltrosGastos,{filters:{...defaults,category:'1',search:'café'},onFilterChange:noop,onClearFilters:noop,categories:[{id:1,nombre:'Comida'}],paymentMethods:[],activeFiltersCount:2,showAdvancedFilters:false,setShowAdvancedFilters:noop})
 assert.match(html,/Quitar filtro: Categoría: Comida/)
 assert.match(html,/Quitar filtro: Búsqueda: café/)
 assert.match(html,/Mes actual/)
})
test('empty account offers creation instead of suggesting filters',()=>{
 const html=render(ListaGastosAgrupados,{gastos:[],hasExpenses:false,onResetFilters:noop,activeFiltersCount:0,groupBy:'none',formatDate:x=>x,formatMoney:x=>x,onDeleteGasto:noop})
 assert.match(html,/Aún no tienes gastos/);assert.match(html,/href="\/form"/)
})
test('a month without matches offers all expenses even when no extra filters are active',()=>{
 const html=render(ListaGastosAgrupados,{gastos:[],hasExpenses:true,onResetFilters:noop,activeFiltersCount:0,groupBy:'month',formatDate:x=>x,formatMoney:x=>x,onDeleteGasto:noop})
 assert.match(html,/No hay gastos con estos filtros/);assert.match(html,/Ver todos los gastos/);assert.doesNotMatch(html,/Aún no tienes gastos/)
})
test('mobile expenses are compact rows rather than cards nested within the result card',()=>{
 const html=render(GastoCard,{gasto:{id:1,descripcion:'Compra del supermercado',monto:25,fecha:'2026-10-02',categoria:{nombre:'Comida'},metodo_pago:{nombre:'Efectivo'}},formatDate:x=>x,formatMoney:x=>`$${x}`,onDeleteGasto:noop})
 assert.doesNotMatch(html,/rounded-xl|Categoría:|Método:/)
 assert.match(html,/Compra del supermercado/);assert.match(html,/Eliminar gasto: Compra/)
})
