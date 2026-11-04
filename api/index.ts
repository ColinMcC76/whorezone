import type { Express, Request, Response } from 'express';

let app: Express | undefined;

async function loadApp(): Promise<Express> {
  if (app) return app;
  const mod = await import('../server/src/app');
  app = mod.createApp();
  return app;
}

export default function handler(req: Request, res: Response): void {
  loadApp()
    .then((expressApp) => {
      expressApp(req, res);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'API failed to start';
      console.error(error);
      if (res.headersSent) return;
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    });
}
