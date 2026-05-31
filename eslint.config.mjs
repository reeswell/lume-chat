// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: true,
    typescript: true,
  },
  {
    files: ['apps/server/**/*.ts'],
    rules: {
      'ts/consistent-type-imports': 'off',
    },
  },
)
