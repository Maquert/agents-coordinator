/**
 * @fileoverview Node.js backend for Antigravity sidecars.
 *
 * This script runs in a background Node.js process. It:
 * 1. Hosts a local HTTP server for the sidecar's Web UI.
 * 2. Exposes APIs to interact with the Antigravity Agent API (via 'agentapi' CLI).
 * 3. Serves 'preload.js' to be injected into the sidecar's frontend.
 */

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRELOAD_PATH = existsSync(join(__dirname, 'preload.js'))
  ? join(__dirname, 'preload.js')
  : join(__dirname, '..', 'preload.js');
const PRELOAD_JS = readFileSync(PRELOAD_PATH, 'utf-8');

// Sidecars serve on loopback only. Remote access is provided by the
// platform's per-sidecar gateway, which authenticates each request and
// forwards it here. Binding a routable interface instead would
// publish the sidecar's API to the network with nothing in front of it.
const BIND_HOST = '127.0.0.1';

export class Response {
  constructor(body, { contentType = 'text/plain', status = 200, headers } = {}) {
    this.body = body;
    this.contentType = contentType;
    this.status = status;
    this.headers = headers;
  }
}

// SidecarApp manages the sidecar's background process, hosting the web server
// and routing API requests to the Antigravity Agent API.
export class SidecarApp {
  #token;
  #port;
  #server;
  #pages = new Map();    // path → () => html
  #apis = new Map();     // path → Map(method → handler)

  constructor() {
    const lsAddr = process.env.ANTIGRAVITY_LS_ADDRESS;
    const csrf = process.env.ANTIGRAVITY_CSRF_TOKEN;
    const portStr = process.env.ANTIGRAVITY_SIDECAR_WEB_PORT;
    if (!lsAddr || !csrf || !portStr) {
      throw new Error(
        'Missing required environment variables (ANTIGRAVITY_LS_ADDRESS, ' +
        'ANTIGRAVITY_CSRF_TOKEN, or ANTIGRAVITY_SIDECAR_WEB_PORT). ' +
        'Is this running in a sidecar environment?'
      );
    }

    this.#token = process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN;
    this.#port = parseInt(portStr);
  }

  get config() {
    return {
      projectId: process.env.ANTIGRAVITY_PROJECT_ID,
      conversationId: process.env.ANTIGRAVITY_CONVERSATION_ID,
    };
  }

  // Sends a message to another conversation.
  sendMessage(conversationId, message, { title, projectId } = {}) {
    const args = ['send-message'];
    if (title) args.push('--title', title);
    args.push(conversationId, message);
    return this.#exec(args, { projectId });
  }

  // Starts a new conversation.
  startConversation(message, { model = 'flash', projectId } = {}) {
    return this.#exec(['new-conversation', '--model', model, message], { projectId });
  }

  // Retrieves metadata for a given conversation.
  getConversationMetadata(conversationId) {
    return this.#exec(['get-conversation-metadata', conversationId]);
  }

  #exec(args, { projectId } = {}) {
    const env = { ...process.env };
    if (projectId) {
      env.ANTIGRAVITY_PROJECT_ID = projectId;
    }

    // Prefer invoking the language server executable's `agentapi` subcommand
    // directly. The framework injects its path via ANTIGRAVITY_AGENTAPI_EXE.
    // This avoids relying on the PATH shim (agentapi / agentapi.bat), which
    // Node's execFileSync cannot resolve on Windows -> "spawnSync agentapi
    // ENOENT". Calling the binary directly also avoids the security risk of
    // running the .bat shim via `shell: true` with user-provided message text.
    const exe = process.env.ANTIGRAVITY_AGENTAPI_EXE;
    const file = exe || 'agentapi';
    const execArgs = exe ? ['agentapi', ...args] : args;

    const out = execFileSync(file, execArgs, {
      encoding: 'utf-8',
      env,
    });
    return out.trim() ? JSON.parse(out) : {};
  }

  // Registers a static HTML page handler.
  page(path, handler) { this.#pages.set(path, handler); }

  // Registers an API endpoint handler.
  api(path, handler, method = 'POST') {
    if (!this.#apis.has(path)) {
      this.#apis.set(path, new Map());
    }
    this.#apis.get(path).set(method.toUpperCase(), handler);
  }

  // Starts the HTTP server and registers default system APIs.
  run() {
    this.#pages.set('/preload.js', () => PRELOAD_JS);
    this.api('/_sidecar/send-message', (data) => {
      return this.sendMessage(
        data.conversationId, data.message, { title: data.title, projectId: data.projectId }
      );
    });
    this.api('/_sidecar/new-conversation', (data) => {
      return this.startConversation(data.message, { model: data.model, projectId: data.projectId });
    });
    this.api('/_sidecar/get-conversation-metadata', (data) => {
      return this.getConversationMetadata(data.conversationId);
    });

    const server = createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${this.#port}`);

      if (req.method !== 'GET' && !this.#validateToken(req, url)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'unauthorized' }));
        return;
      }

      if (req.method === 'GET' && this.#pages.has(url.pathname)) {
        const content = await this.#pages.get(url.pathname)();
        if (content instanceof Response) {
          res.writeHead(content.status || 200, { 'Content-Type': content.contentType, ...content.headers });
          res.end(content.body);
          return;
        }
        const isJS = url.pathname.endsWith('.js');
        res.writeHead(200, {
          'Content-Type': isJS ? 'application/javascript' : 'text/html',
        });
        res.end(content);
        return;
      }

      if (this.#apis.has(url.pathname)) {
        const methodMap = this.#apis.get(url.pathname);
        if (methodMap.has(req.method)) {
          const handler = methodMap.get(req.method);
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = {};
              if (req.method === 'GET' || url.searchParams.size > 0) {
                for (const [key, value] of url.searchParams.entries()) {
                  if (key.toLowerCase() !== 'token') {
                    data[key] = value;
                  }
                }
              }
              if (body) {
                Object.assign(data, JSON.parse(body));
              }
              const result = await handler(data);
              if (result instanceof Response || (result && typeof result === 'object' && result.contentType && result.body !== undefined)) {
                const status = result.status || 200;
                const respBody = typeof result.body === 'string' ? result.body : Buffer.from(result.body);
                res.writeHead(status, { 'Content-Type': result.contentType, ...result.headers });
                res.end(respBody);
                return;
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
      }

      res.writeHead(404);
      res.end('Not found');
    });

    return new Promise((resolve) => {
      this.#server = server.listen(this.#port, BIND_HOST, () => {
        console.log(`[sidecar] listening on ${BIND_HOST}:${server.address().port}`);
        resolve(server);
      });
    });
  }

  close() {
    return new Promise((resolve) => this.#server ? this.#server.close(() => resolve()) : resolve());
  }

  #validateToken(req, url) {
    if (url.pathname === '/preload.js') return true;
    if (!this.#token) return true;
    const provided =
      req.headers['x-sidecar-token'] || url.searchParams.get('token');
    return provided === this.#token;
  }
}
