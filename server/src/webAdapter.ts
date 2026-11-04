import { IncomingMessage, ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import { Duplex } from 'node:stream';
import type { Express } from 'express';

class MemorySocket extends Duplex {
  override _read(): void {}

  override _write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    callback();
  }

  setTimeout(): this {
    return this;
  }

  setNoDelay(): this {
    return this;
  }

  setKeepAlive(): this {
    return this;
  }
}

function headerValue(value: number | string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/**
 * Run one Web Request through the Express app and return a Web Response.
 * Vercel Node 26 invokes /api with `export default { fetch(request) }`.
 */
export function invokeExpress(app: Express, request: Request): Promise<Response> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(request.url);
      const socket = new MemorySocket();
      const req = new IncomingMessage(socket as unknown as Socket);
      req.method = request.method;
      req.url = `${url.pathname}${url.search}`;
      req.headers = {};
      request.headers.forEach((value, key) => {
        req.headers[key] = value;
      });

      const finishBody = (bytes: Buffer | null) => {
        if (bytes && bytes.length > 0) {
          req.headers['content-length'] = String(bytes.length);
        }
        let sent = false;
        req._read = () => {
          if (sent) return;
          sent = true;
          if (bytes && bytes.length > 0) req.push(bytes);
          req.push(null);
        };

        const res = new ServerResponse(req);
        const chunks: Buffer[] = [];
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          const headers = new Headers();
          for (const [key, value] of Object.entries(res.getHeaders())) {
            const rendered = headerValue(value as number | string | string[] | undefined);
            if (rendered !== undefined) headers.set(key, rendered);
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode || 200,
              headers,
            }),
          );
        };

        res.write = ((chunk: unknown) => {
          if (chunk && typeof chunk !== 'function') {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
          }
          return true;
        }) as typeof res.write;

        res.end = ((chunk?: unknown) => {
          if (chunk && typeof chunk !== 'function') {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
          }
          finish();
          return res;
        }) as typeof res.end;

        socket.on('error', () => {});
        try {
          app(req, res);
        } catch (error) {
          reject(error);
        }
      };

      if (request.body) {
        request
          .arrayBuffer()
          .then((buffer) => finishBody(Buffer.from(buffer)))
          .catch(reject);
      } else {
        finishBody(null);
      }
    } catch (error) {
      reject(error);
    }
  });
}
