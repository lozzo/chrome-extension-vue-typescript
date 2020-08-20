module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential', // this is a default sub-set of rules for your .vue files
    '@vue/typescript', // default typescript related rules
  ],

  rules: {
    // you can put some custom rules here
    "prettier/prettier": "error",
    'vue/no-parsing-error': [2, {
      "x-invalid-end-tag": false
    }],
    // 禁止使用 var
    "no-var": "error",
    // 优先使用 interface 而不是 type
    "@typescript-eslint/consistent-type-definitions": [
      "error",
      "interface"
    ],
    "prefer-const": 2,
    // 要求在注释周围有空行 (要求在块级注释之前有一空行)
    "lines-around-comment": [1, {
      "beforeBlockComment": true
    }],
  },
  plugins: [
    "prettier"
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser', // the typescript-parser for eslint, instead of tslint
    sourceType: 'module', // allow the use of imports statements
    ecmaVersion: 2018, // allow the parsing of modern ecmascript
  },
};