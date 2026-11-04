import type { Express } from 'express';
import { invokeExpress } from '../server/src/webAdapter';

let app: Express | undefined;

async function loadApp(): Promise<Express> {
  if (!app) {
    const mod = await import('../server/src/app');
    app = mod.createApp();
  }
  return app;
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const expressApp = await loadApp();
      return await invokeExpress(expressApp, request);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'API failed to start';
      return Response.json({ error: message }, { status: 500 });
    }
  },
};
