import { createServer } from 'node:http';
import type { Server, IncomingMessage, ServerResponse } from 'node:http';

type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

interface MockRoute {
  method: string;
  path: string;
  handler: RouteHandler;
}

export class MockServer {
  private server: Server | null = null;
  private routes: MockRoute[] = [];
  private port = 0;

  get url(): string {
    return `http://localhost:${this.port}`;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res).catch(() => {
          res.writeHead(500);
          res.end();
        });
      });
      this.server.listen(0, () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
        }
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.routes = [];
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  on(method: string, path: string, handler: RouteHandler): void {
    this.routes.push({ method: method.toUpperCase(), path, handler });
  }

  onGet(path: string, handler: RouteHandler): void {
    this.on('GET', path, handler);
  }

  onPost(path: string, handler: RouteHandler): void {
    this.on('POST', path, handler);
  }

  onPatch(path: string, handler: RouteHandler): void {
    this.on('PATCH', path, handler);
  }

  onPut(path: string, handler: RouteHandler): void {
    this.on('PUT', path, handler);
  }

  onDelete(path: string, handler: RouteHandler): void {
    this.on('DELETE', path, handler);
  }

  respondJson(res: ServerResponse, data: unknown, status = 200): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  respondError(res: ServerResponse, code: string, message: string, status: number): void {
    this.respondJson(res, { error: { code, message } }, status);
  }

  async parseBody<T>(req: IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body) as T);
        } catch {
          resolve({} as T);
        }
      });
      req.on('error', reject);
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const route = this.routes.find(
      (r) => r.method === req.method && this.matchPath(r.path, req.url ?? ''),
    );

    if (route) {
      await route.handler(req, res);
    } else {
      this.respondError(res, 'NOT_FOUND', 'Route not found', 404);
    }
  }

  private matchPath(pattern: string, url: string): boolean {
    const urlPath = url.split('?')[0];
    const patternParts = pattern.split('/');
    const urlParts = urlPath.split('/');

    if (patternParts.length !== urlParts.length) {
      return false;
    }

    return patternParts.every(
      (part, i) => part.startsWith(':') || part === urlParts[i],
    );
  }
}
