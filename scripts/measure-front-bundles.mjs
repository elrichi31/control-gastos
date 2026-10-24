import fs from 'node:fs'
import vm from 'node:vm'
import zlib from 'node:zlib'
import path from 'node:path'

// Estimate entry JavaScript from an emitted webpack build, even when collecting
// page data fails. This excludes asynchronous chunks and is not a browser trace.
const routes = ['dashboard', 'detalle-gastos', 'estadisticas', 'form', 'presupuesto', 'presupuesto/[id]']
const root = JSON.parse(fs.readFileSync('.next/build-manifest.json', 'utf8')).rootMainFiles
const results = routes.map(route => {
  const context = {}
  vm.runInNewContext(fs.readFileSync(`.next/server/app/${route}/page_client-reference-manifest.js`, 'utf8'), context)
  const manifest = context.__RSC_MANIFEST[`/${route}/page`]
  const files = new Set(root)
  const entries = new Set([
    'src/app/layout.tsx', `src/app/${route}/page.tsx`, 'src/app/error.tsx',
    'src/components/layout/AppShell.tsx', 'src/components/layout/Providers.tsx',
  ])
  for (const [name, entry] of Object.entries(manifest.clientModules)) {
    if (!entries.has(name.replace(`${process.cwd()}/`, ''))) continue
    for (const file of entry.chunks) if (file.endsWith('.js')) files.add(file)
  }
  const chunks = [...files].map(file => fs.readFileSync(path.join('.next', decodeURIComponent(file))))
  return {
    route: `/${route}`, files: [...files],
    rawBytes: chunks.reduce((sum, buffer) => sum + buffer.length, 0),
    gzipBytes: chunks.reduce((sum, buffer) => sum + zlib.gzipSync(buffer).length, 0),
  }
})
console.log(JSON.stringify(results, null, 2))
