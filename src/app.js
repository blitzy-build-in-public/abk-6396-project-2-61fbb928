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

export function createServer() {
  return http.createServer(handleRequest);
}
