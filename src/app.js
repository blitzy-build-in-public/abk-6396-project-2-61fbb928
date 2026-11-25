import http from 'node:http';

export const HELLO_PATH = '/hello';
export const HELLO_BODY = 'Hello world';
export const NOT_FOUND_BODY = 'Not Found';

export function handleRequest(req, res) {
  // The target is resolved against a fixed base and only its pathname is read, so a
  // client-supplied host (in the Host header, or inside an absolute-form target such as
  // `GET http://evil.example/hello HTTP/1.1`) cannot choose which route matches.
  let pathname = null;
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    // A target the URL parser rejects has no pathname to match, so it keeps the null
    // default and falls through to the same 404 as any other unmatched request. The
    // failure is caught here because a throw escaping the request listener ends the
    // process without sending a response, leaving the client unanswered.
  }
  const isHello = (req.method === 'GET' || req.method === 'HEAD') && pathname === HELLO_PATH;

  // Setting statusCode and the content type with setHeader, then declaring the
  // length, keeps every answer fixed-length; answering with res.writeHead(...)
  // instead would send Transfer-Encoding: chunked and no Content-Length, which
  // the contract forbids. Node derives the length from the body on HTTP/1.1
  // only, so it is declared here, and only for a response with a body, since a
  // HEAD answer has none to delimit.
  const body = isHello ? HELLO_BODY : NOT_FOUND_BODY;
  res.statusCode = isHello ? 200 : 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  if (req.method !== 'HEAD') res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

// node:http dispatches a CONNECT request to the server's 'connect' event rather than the
// request listener: its target names an authority instead of a path, and what the event
// hands over is the raw socket of the tunnel, with no ServerResponse to answer with.
// CONNECT is never GET or HEAD, so even a CONNECT aimed at /hello is answered with the
// contract's 404, written as fixed-length bytes to the socket itself.
function handleConnect(req, socket) {
  // The 'connect' event hands over the raw socket once node:http has detached its own
  // handling of it, so no 'error' listener remains on the connection. A client that
  // resets while this answer is being written would then raise an unhandled 'error' and
  // end the process; handling it here confines the failure to that one connection.
  socket.on('error', () => socket.destroy());
  const head = [
    'HTTP/1.1 404 Not Found',
    'Content-Type: text/plain; charset=utf-8',
    `Content-Length: ${Buffer.byteLength(NOT_FOUND_BODY)}`,
    'Connection: close',
    '',
  ].join('\r\n');
  socket.end(`${head}\r\n${NOT_FOUND_BODY}`);
}

export function createServer() {
  const server = http.createServer(handleRequest);
  server.on('connect', handleConnect);
  return server;
}
