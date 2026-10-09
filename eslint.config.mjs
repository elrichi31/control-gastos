import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/**', 'tests/**']),
  {
    // Reglas bajadas a warn por violaciones existentes (no se arreglan en HU-3)
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // 39 existentes, ver HU-4
      '@typescript-eslint/no-require-imports': 'warn', // 3 existentes
      'react-hooks/set-state-in-effect': 'warn', // 20 existentes
      'react-hooks/refs': 'warn', // 2 existentes
      'react-hooks/static-components': 'warn', // 1 existente
    },
  },
])
