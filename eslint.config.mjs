import { defineConfig } from 'eslint/config'
import nextCoreVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  {
    // Vendored agent skill assets — not project source code
    ignores: ['.agents/**'],
  },
  ...nextCoreVitals,
  ...nextTypescript,
  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
