require('./helpers/register-ts.cjs')
const {test}=require('node:test')
const assert=require('node:assert/strict')
const React=require('react')
const {renderToStaticMarkup}=require('react-dom/server')
const {BudgetSummary}=require('../src/components/presupuesto/BudgetSummary.tsx')
const {MonthCard}=require('../src/components/presupuesto/MonthCard.tsx')
const {YearSummary}=require('../src/components/presupuesto/YearSummary.tsx')
const render=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props))
const data={total:500,expenses:5,status:'in-progress',trend:'stable',previousMonth:400,id:1}
const month={name:'Octubre',value:'octubre',number:10}
test('budget states communicate safe, near-limit, exact-limit and overshoot with text',()=>{
 for(const [spent,label] of [[20,'Dentro del límite'],[80,'Cerca del límite'],[100,'Al límite'],[120,'Límite excedido']])assert.match(render(BudgetSummary,{presupuestado:100,gastado:spent}),new RegExp(label))
})
test('budget progress is accessible and caps the visual bar without hiding overshoot',()=>{
 const html=render(BudgetSummary,{presupuestado:100,gastado:120})
 assert.match(html,/role="progressbar"/);assert.match(html,/aria-valuenow="100"/);assert.match(html,/aria-valuetext="120% del presupuesto consumido"/)
 const empty=render(BudgetSummary,{presupuestado:0,gastado:20})
 assert.match(empty,/Sin presupuesto/);assert.doesNotMatch(empty,/role="progressbar"|Dentro del límite|Excedido|Disponible/)
})
test('forecast overshoot remains distinct from actual expense overshoot',()=>{
 const html=render(BudgetSummary,{presupuestado:100,gastado:75,planning:{committed:50,available:-25,daily:0,daysLeft:30}})
 assert.match(html,/Exceso previsto/);assert.doesNotMatch(html,/Dentro del límite|Límite excedido/);assert.match(html,/75% del presupuesto consumido/)
})
test('empty months never claim a spending decrease and expose a touch-friendly removal action',()=>{
 const html=render(MonthCard,{month,data:{...data,total:0,expenses:0,status:'pending'},isCurrentMonth:false,onRemove(){}})
 assert.doesNotMatch(html,/100%/);assert.match(html,/Sin gastos/);assert.match(html,/aria-label="Quitar Octubre"/);assert.match(html,/h-11 w-11/)
})
test('month comparison explains the baseline and old years never show Actual',()=>{
 const html=render(MonthCard,{month,data,isCurrentMonth:true,onRemove(){}})
 assert.match(html,/25%/);assert.match(html,/vs\. mes anterior/);assert.match(html,/Actual/)
 const previousYear=render(MonthCard,{month,data:{...data,status:'completed'},isCurrentMonth:true,onRemove(){}})
 assert.doesNotMatch(previousYear,/>Actual</)
})
test('annual overview maps highest spending to the correct month when an entry is missing',()=>{
 const html=render(YearSummary,{monthlyData:{febrero:data},activeMonths:['enero','febrero'],anio:'2026'})
 assert.match(html,/Febrero/);assert.match(html,/Gasto registrado/);assert.match(html,/\$500\.00/)
})
