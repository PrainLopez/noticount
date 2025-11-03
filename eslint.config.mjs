import antfu from "@antfu/eslint-config";

export default
antfu(
  {
    type: "app",
    nextjs: true,
    react: true,
    typescript: true,
    formatters: true,
    stylistic: {
      "indent": 2,
      "semi": true,
      "quotes": "double",
      "react/jsx-indent": [2, 2],
      "trailingComma": "never",
    },
  },
  {
    rules: {
      "next/no-sync-scripts": "off",
      "style/max-statements-per-line": ["error", { max: 2 }],
      "ts/no-redeclare": "off",
      "ts/consistent-type-definitions": ["error", "type"],
      "no-console": ["warn"],
      "antfu/no-top-level-await": ["off"],
      "node/prefer-global/process": ["off"],
      "node/no-process-env": ["error"],
      "style/jsx-one-expression-per-line": ["off"],
      "perfectionist/sort-imports": [
        "warn",
        {
          tsconfigRootDir: ".",
        },
      ],
      "perfectionist/sort-exports": ["warn"],
      "unicorn/filename-case": [
        "error",
        {
          case: "kebabCase",
          ignore: ["README.md"],
        },
      ],
    },
  },
  {
    files: ["src/env.js"],
    rules: {
      "node/no-process-env": "off",
    },
  },
);
