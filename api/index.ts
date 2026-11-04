import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';

let app: Express | undefined;

async function loadApp(): Promise<Express> {
  if (!app) {
    const mod = await import('../server/src/app');
    app = mod.createApp();
  }
  return app;
}

function errorBody(error: unknown): string {
  const message = error instanceof Error ? error.message : 'API failed to start';
  const stack = error instanceof Error ? error.stack : undefined;
  return JSON.stringify({ error: message, stack });
}

function isWebRequest(value: unknown): value is Request {
  return typeof Request !== 'undefined' && value instanceof Request;
}

/**
 * Vercel invokes this file as a Node function: `(req, res)`.
 * The handler must be a function, and it must not resolve until the
 * response has been finished. A `{ fetch }` export is not called.
 */
export default async function handler(
  req: IncomingMessage | Request,
  res?: ServerResponse,
): Promise<Response | void> {
  try {
    if (isWebRequest(req) && !res) {
      const { invokeExpress } = await import('../server/src/webAdapter');
      return await invokeExpress(await loadApp(), req);
    }
    if (!res) {
      throw new Error('API function was called without a Node response');
    }
    const expressApp = await loadApp();
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      res.once('finish', finish);
      res.once('close', finish);
      try {
        expressApp(req as IncomingMessage, res);
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error(error);
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(errorBody(error));
      return;
    }
    const message = error instanceof Error ? error.message : 'API failed to start';
    return Response.json({ error: message }, { status: 500 });
  }
}

// Vercel skips its response helpers when the listener has a listen method
// (the Express app shape). Those helpers replace res.json and can crash
// the invocation before this function runs.
(handler as typeof handler & { listen: () => void }).listen = function listen() {
  return undefined;
};
