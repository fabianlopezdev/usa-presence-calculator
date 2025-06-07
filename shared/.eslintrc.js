module.exports = {
  extends: '../.eslintrc.js',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Shared package specific rules
    '@typescript-eslint/explicit-module-boundary-types': 'error',
  },
};