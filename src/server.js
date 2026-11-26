import process from 'node:process';
import { createServer } from './app.js';

// `??` would pass an explicitly empty HOST through, and Node then binds every interface
// instead of loopback, so this default checks falsiness rather than null or undefined.
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT ?? 3000);

const server = createServer();

server.listen(PORT, HOST, () => {
  // server.address() stays null until the 'listening' event fires, so the bound address is
  // read here in the callback; read eagerly after the listen call it would still be null.
  const { address, port } = server.address();
  // An IPv6 address must be bracketed to read as the host of a URL.
  const host = address.includes(':') ? `[${address}]` : address;
  console.log(`Listening on http://${host}:${port}`);
});
