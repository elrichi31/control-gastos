const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const ts=require('typescript')

test('expense filters never declare the same JSX attribute twice',()=>{
 const file=path.resolve(__dirname,'../src/components/detalle-gastos/FiltrosGastos.tsx')
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
 const duplicates=[]
 function visit(node){
  if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)){
   const names=new Set()
   for(const attribute of node.attributes.properties){
    if(!ts.isJsxAttribute(attribute))continue
    const name=attribute.name.getText(source)
    if(names.has(name))duplicates.push(`${name} at line ${source.getLineAndCharacterOfPosition(attribute.getStart(source)).line+1}`)
    names.add(name)
   }
  }
  ts.forEachChild(node,visit)
 }
 visit(source)
 assert.deepEqual(duplicates,[])
})
