// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Apostrophes in JSX text are fine — not a bug
      "react/no-unescaped-entities": "off",
      // setState in effects is a common pattern; warn but don't error
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
