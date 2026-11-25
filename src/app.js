import http from 'node:http';

export const HELLO_PATH = '/hello';
export const HELLO_BODY = 'Hello world';
export const NOT_FOUND_BODY = 'Not Found';

export function handleRequest(req, res) {
  // The target is resolved against a fixed base and only its pathname is read, so a
  // client-supplied host (in the Host header, or inside an absolute-form target such as
  // `GET http://evil.example/hello HTTP/1.1`) cannot choose which route matches.
  const { pathname } = new URL(req.url, 'http://localhost');
  const isHello = (req.method === 'GET' || req.method === 'HEAD') && pathname === HELLO_PATH;

  // Setting statusCode and the content type directly lets Node compute a fixed
  // Content-Length from the body; answering through the head-writing form instead would
  // send Transfer-Encoding: chunked and no Content-Length, which the contract forbids.
  res.statusCode = isHello ? 200 : 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(isHello ? HELLO_BODY : NOT_FOUND_BODY);
}

export function createServer() {
  return http.createServer(handleRequest);
}
