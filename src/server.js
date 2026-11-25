import process from 'node:process';
import { createServer } from './app.js';

const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number(process.env.PORT ?? 3000);

const server = createServer();

server.listen(PORT, HOST, () => {
  // server.address() stays null until the 'listening' event fires, so the bound address is
  // read here in the callback; read eagerly after the listen call it would still be null.
  const { address, port } = server.address();
  console.log(`Listening on http://${address}:${port}`);
});
