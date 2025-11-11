// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      '.expo/*',
      'web-build/*',
      'server/node_modules/*',
      'server/python_script/__pycache__/*',
      'app/(tabs)/translation/backend/__pycache__/*'
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        __DEV__: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      // React Native 友善規則
      'no-console': 'warn',                    // 開發時允許 console.log
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'react/prop-types': 'off',              // 關閉 PropTypes (使用 TypeScript)
      
      // 程式碼品質
      'eqeqeq': ['error', 'always'],          // 強制 === 
      'no-var': 'error',                      // 禁用 var
      'prefer-const': 'warn',                 // 建議使用 const
      
      // 可讀性
      'semi': ['warn', 'always'],             // 建議分號
      'quotes': ['warn', 'single'],           // 建議單引號
      'comma-dangle': ['warn', 'always-multiline'], // 尾隨逗號
      
      // React/React Native 特定
      'react-hooks/exhaustive-deps': 'warn',  // useEffect 依賴檢查
      'react/jsx-uses-react': 'off',          // React 17+ 不需要
      'react/react-in-jsx-scope': 'off',      // React 17+ 不需要
      
      // 檔案命名規範：含 JSX 的檔案必須使用 .jsx 副檔名
      'react/jsx-filename-extension': ['warn', { 
        extensions: ['.jsx', '.tsx'],
        allow: 'as-needed' // 允許 .js/.ts 但不建議
      }],
    },
  },
  {
    // 伺服器端檔案特殊規則
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',                    // 伺服器端允許 console
    },
  },
]);
