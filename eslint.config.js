import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const DOMAIN_MESSAGE = 'src/domain phải là TypeScript thuần (xem CLAUDE.md, luật kiến trúc 1-2).';

export default defineConfig(
  { ignores: ['dist', 'dev-dist', 'coverage'] },
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': 'error',
    },
  },
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.mjs', 'tools/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['phaser', 'phaser/*', '@scenes/*', '@ui/*', '@platform/*', '@save/*'],
              message: DOMAIN_MESSAGE,
            },
            {
              group: ['**/scenes/**', '**/ui/**', '**/platform/**', '**/save/**'],
              message: DOMAIN_MESSAGE,
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'localStorage', 'navigator', 'performance', 'Date'].map(
          (name) => ({ name, message: DOMAIN_MESSAGE }),
        ),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Dùng Rng trong src/domain/rng.ts.' },
      ],
    },
  },
);
