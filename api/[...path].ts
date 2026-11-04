import { handleApi } from '../server/src/httpApi';

async function fetch(request: Request): Promise<Response> {
  try {
    return await handleApi(request);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'API failed';
    return Response.json({ error: message }, { status: 500 });
  }
}

export function GET(request: Request) {
  return fetch(request);
}

export function POST(request: Request) {
  return fetch(request);
}

export function PUT(request: Request) {
  return fetch(request);
}

export function PATCH(request: Request) {
  return fetch(request);
}

export function DELETE(request: Request) {
  return fetch(request);
}

export function OPTIONS(request: Request) {
  return fetch(request);
}

export default { fetch };
