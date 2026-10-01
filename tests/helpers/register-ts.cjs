const fs = require("node:fs")
const path = require("node:path")
const Module = require("node:module")
const ts = require("typescript")
// Use the project's TypeScript compiler: no additional test dependencies.
const root = path.resolve(__dirname, '../..')
const resolve = Module._resolveFilename
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, ...args)
}
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: filename,
    })
    module._compile(outputText, filename)
  }
}
module.exports = { root }
