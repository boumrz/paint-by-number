module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "18.2" } },
  plugins: [
    "react-refresh",
    "unused-imports", // плагин для неиспользуемых импортов
    "simple-import-sort" // плагин для сортировки импортов
  ],
  rules: {
    // Основные правила
    indent: ["error", 4], // 4 пробела для табуляции
    "react/jsx-indent": ["error", 4], // 4 пробела для JSX
    "react/jsx-indent-props": ["error", 4], // 4 пробела для пропсов JSX

    // Сортировка импортов
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "unused-imports/no-unused-imports": "warn", // неиспользуемые импорты
    
    // Неиспользуемый код
    "no-unused-vars": "warn",
    
    // Inline стили
    "react/no-inline-styles": "warn",
    
    // React правила
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "react/prop-types": "off",
  },
};