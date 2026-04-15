import { buildApp } from './app';
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const app = buildApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});
