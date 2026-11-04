import { build } from 'esbuild';

await build({
  entryPoints: ['server/src/httpApi.ts'],
  outfile: 'server/handler.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  legalComments: 'none',
  logLevel: 'info',
  external: ['@vercel/blob'],
});
