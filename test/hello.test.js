import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = createServer();
  // Port 0 lets the operating system pick a free port, so the suite never collides
  // with a running tutorial instance or with a second run of itself.
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  // A name-pattern filter that matches no case lets the runner reach this hook before the
  // before hook's asynchronous listen has completed, so wait for the server to start first.
  if (!server.listening) await new Promise((resolve) => server.once('listening', resolve));
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test('GET /hello returns 200 with the exact greeting', async () => {
  const res = await fetch(`${baseUrl}/hello`);

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  // A fixed Content-Length with no Transfer-Encoding rejects the chunked answer a handler
  // written with res.writeHead(...) plus res.end(body) would send.
  assert.equal(res.headers.get('content-length'), '11');
  assert.equal(res.headers.get('transfer-encoding'), null);
  assert.equal(await res.text(), 'Hello world');
});

test('GET /hello ignores a query string', async () => {
  const res = await fetch(`${baseUrl}/hello?name=world`);

  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'Hello world');
});

test('HEAD /hello returns 200 with no body', async () => {
  const res = await fetch(`${baseUrl}/hello`, { method: 'HEAD' });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(res.headers.get('content-length'), null);
  assert.equal(await res.text(), '');
});

// `/hello/` is a different pathname from `/hello`, so the exact-match rule rejects it.
test('GET /hello/ returns 404 Not Found', async () => {
  const res = await fetch(`${baseUrl}/hello/`);

  assert.equal(res.status, 404);
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(res.headers.get('content-length'), '9');
  assert.equal(await res.text(), 'Not Found');
});

test('POST /hello returns 404', async () => {
  const res = await fetch(`${baseUrl}/hello`, { method: 'POST' });

  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'Not Found');
});
