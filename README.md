# Node.js hello tutorial

## What this project is

A small Node.js HTTP server that exposes exactly one endpoint, `/hello`, and answers any HTTP client that calls it with the literal text `Hello world`. A `GET` request on `/hello` returns status `200`, the media type `text/plain; charset=utf-8` and the body `Hello world`, while a `HEAD` request on it returns the same status and media type with no body and no `Content-Length`; every other path, and every other method on `/hello`, returns `404` with the body `Not Found`. The server is built on Node's own `node:http` module — there is no framework, no build step and no dependency to install.

The code is three files: `src/server.js` reads the host and port and starts listening, `src/app.js` decides what each request is answered with, and `test/hello.test.js` checks that contract over a real socket.

## Prerequisites

Node.js 22 or later. Check which version you have:

```bash
node --version
```

Expect `v22.` or later — for example:

```console
v22.23.5
```

The repository declares that requirement in three places, because each one reaches a different tool: `engines.node` in `package.json` is `>=22.0.0`, `.nvmrc` contains the single line `22` for version managers, and this section. If you use a version manager, run `nvm use` in the repository root to switch to the pinned line. `engines` is only advisory to npm unless `engine-strict` is set, which is why the release line is also pinned in `.nvmrc`.

If `node --version` prints something below `v22.`, install the Node.js 22 LTS line and run `nvm use`. Node.js 18 and 20 still run this code — `node:test` and the global `fetch` the tests use both exist there — but both are end of life and receive no security fixes. Releases older than that cannot run it: they lack a global `fetch`, and the oldest also lack `node:test`, so `npm test` fails with `fetch is not defined` or `Cannot find module 'node:test'`.

## Install

From the repository root:

```bash
npm install
```

```console
up to date, audited 1 package in 183ms

found 0 vulnerabilities
```

The figure before `ms` varies from machine to machine; the two lines and the zero vulnerabilities do not. Nothing is downloaded: the manifest declares no dependency, so the command only reads the tree and writes `package-lock.json`, which is already committed. A registry or proxy problem therefore cannot stop you here — if the command complains about reaching a registry, continue to the next step, because nothing the tests use is fetched from one.

## Run the tests

```bash
npm test
```

That runs `node --test` from the repository root. It needs no configuration: `test/hello.test.js` matches the runner's default `test/**/*.js` pattern. Each case talks to a server started on port `0`, so the operating system picks a free port and the suite can never collide with a running tutorial instance or with a second run of itself.

The run ends with a summary of this kind, and exits with code `0`:

```console
1..5
# tests 5
# suites 0
# pass 5
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms <varies>
```

The block above, with an `ok` line per case, is the form a piped or continuous-integration run prints on Node.js 22 — the 200 greeting, the ignored query string, the bodiless `HEAD`, the trailing-slash 404 and the `POST` 404. In an interactive terminal Node's spec reporter prints the same five cases as `✔` lines and the same counts as `ℹ tests 5`, `ℹ pass 5` and `ℹ fail 0`, with no plan line and no `ok` lines at all, and from Node.js 23 the spec reporter is the default for piped output too. Compare the counts the run reports rather than the punctuation around them, and check that the command exits with code `0`.

If a case fails, the source no longer matches this tutorial. A wrong body or content type points at `handleRequest` in `src/app.js`. A wrong `content-length` points at how the response is ended there: the handler sets `res.statusCode` and `res.setHeader(...)`, declares the length itself with `Content-Length` and calls `res.end(body)`, where leaving the length to Node drops it from an HTTP/1.0 response and answering through `res.writeHead(...)` would send `Transfer-Encoding: chunked` and no length at all.

## Start the server

In the first terminal, from the repository root:

```bash
npm start
```

which runs `node src/server.js`. Expect:

```console
> nodejs-hello-tutorial@1.0.0 start
> node src/server.js

Listening on http://127.0.0.1:3000
```

The first two lines are npm echoing the script it ran; the last one is the server reporting the address it bound. No prompt returns: the process holds the terminal until you stop it, which is what you want while you call it. Leave it running and open a second terminal for the next steps.

`EADDRINUSE` here means port 3000 is already taken — by an instance you started earlier in another terminal, or by another program. Stop that process, or use the port override documented below.

## Call the endpoint

In the second terminal, with the server still running in the first:

```bash
curl -isS http://127.0.0.1:3000/hello
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Date: <generated per request>
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 11

Hello world
```

`Date`, `Connection` and `Keep-Alive` are produced by Node's HTTP layer, not by this project, and they differ from machine to machine and with connection reuse. Everything else — the status line, the content type, the length and the body — matches character for character.

`Could not connect` means nothing is listening there: the server is not running, or it is on a different port. A 404 means the path was mistyped or given a trailing slash.

An unknown path answers 404 with a shorter body:

```bash
curl -isS http://127.0.0.1:3000/nope
```

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Date: <generated per request>
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 9

Not Found
```

## What a correct response looks like

Check these, and ignore anything else the response carries:

- the status is `200`
- `Content-Type: text/plain; charset=utf-8`
- `Content-Length: 11`
- the body is exactly `Hello world` — 11 bytes, no trailing newline, no quotes, a capital `H` and a lowercase `w` (not `Hello World`)
- `Date`, `Connection` and `Keep-Alive` come from Node's HTTP layer and will differ between machines, so do not compare them

The quoted blocks and the fixed `Content-Length: 11` and `Content-Length: 9` are what an HTTP/1.1 client receives, which is what `curl` and browsers send by default and what the commands in this tutorial use; an HTTP/1.0 client such as `curl --http1.0` gets the same status, content type, `Content-Length` and body, because the handler declares the length itself instead of relying on Node's HTTP/1.1 default.

Confirm the length in the second terminal:

```bash
curl -s http://127.0.0.1:3000/hello | wc -c
```

```console
11
```

`12` means a newline was added to the body. Any other value means `HELLO_BODY` in `src/app.js` was changed.

The rest of the contract, from the same second terminal:

```bash
curl -isS --head http://127.0.0.1:3000/hello
curl -isS 'http://127.0.0.1:3000/hello?name=world'
curl -isS http://127.0.0.1:3000/hello/
```

`HEAD /hello` returns `200` with the same content type, no body and no `Content-Length`. `GET /hello?name=world` returns the same 200 response as `/hello`, because routing reads the pathname only and ignores the query string. `GET /hello/` is a 404, because the pathname must match `/hello` exactly — a trailing slash is a different path.

## Stop the server

Press `Ctrl-C` in the terminal that is running `npm start`. The process exits, the prompt returns in that terminal, and port 3000 is released.

If a later start reports `EADDRINUSE`, an earlier instance is still running in another terminal: stop it there and start again.

## Change the port

With the server stopped — the port has to be free — start it on another port:

```bash
PORT=4500 npm start
```

```console
> nodejs-hello-tutorial@1.0.0 start
> node src/server.js

Listening on http://127.0.0.1:4500
```

The same client commands against port 4500 return the same responses:

```bash
curl -isS http://127.0.0.1:4500/hello
```

`HOST` works the same way: it defaults to `127.0.0.1` and `PORT` defaults to `3000`. Those are the two settings `src/server.js` reads from the environment, and the loopback default means the tutorial answers requests from your own machine only unless you change it: there is no source edit to make and no `.env` file involved.

## Extend the project

The application code is about forty lines including comments — `handleRequest` and `createServer` in `src/app.js`, plus the entry point — with a test file of comparable size. You can read all of it in one sitting and still hold the HTTP module in your head while you do.

To add a route, make two edits:

1. Add a branch to `handleRequest` in `src/app.js` for your new pathname, keeping the same shape as the `/hello` branch: read the pathname from `req.url`, decide, then set `res.statusCode`, set `res.setHeader('Content-Type', ...)`, set `res.setHeader('Content-Length', ...)` for a response that writes a body and call `res.end(body)`.
2. Add a case to `test/hello.test.js` that calls the new path on the suite's server and asserts its status and body.

Both fit inside files that already exist, so an extra route needs no new module, no router and no dependency.

### What this tutorial leaves out, and why

The project is shaped for reading, so it differs from a production service in five deliberate ways: one handler in one file, with the whole routing decision visible in a single expression instead of a router module; a `console.log` line naming the bound address instead of a logger, so you can see where to point your client; inline defaults for the two settings instead of a configuration module or a `.env` file, so no file has to be understood before the first run; the quoted response above, which a production README would leave to an API document; and no shutdown hooks, because `Ctrl-C` is the documented stop and graceful shutdown would be code you never get to exercise.

For the same reason the project has no framework, no request-body parsing, no persistence, no authentication, no rate limiting, no container image, no CI workflow, no deployment target, no TLS, no process manager, no type system, no coverage gate, no health or metrics endpoint and no build step: each one adds a step between you and the first response, and none of them is needed to answer `/hello`. What it does have is a posture proportionate to a tutorial — it binds to loopback, reads no request body, touches no file and evaluates no input, and its routing never uses a host supplied by the client.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `node --version` prints below `v22.` | Node.js 18 and 20 still run the code but are end of life and get no security fixes; older releases lack a global `fetch`, so `npm test` fails with `fetch is not defined`, and the oldest also lack `node:test`, failing with `Cannot find module 'node:test'` | Install the Node.js 22 LTS line and run `nvm use` |
| `npm test` fails on the body or the content type | `handleRequest` in `src/app.js` no longer answers with `Hello world` and `text/plain; charset=utf-8` | Restore `HELLO_BODY` and the `Content-Type` header |
| `npm test` fails on `content-length`, and the response carries `transfer-encoding: chunked` | The response is written with `res.writeHead(...)` instead of `res.statusCode` plus `res.setHeader` and `res.end(body)` | Use the second form, which declares a fixed `Content-Length` itself |
| `Error: listen EADDRINUSE: address already in use 127.0.0.1:3000` on start | Port 3000 is already bound, by an earlier instance or by another program | Stop that process, or start with `PORT=4500 npm start` |
| `curl: (7) Failed to connect ... Could not connect to server` | Nothing is listening on that host and port | Start the server, and check the host and port match the `Listening on ...` line |
| A 404 for a path you believe is correct | The path is not exactly `/hello` (for example `/hello/` or `/hello/world`), or the method is not `GET` or `HEAD` | Remove the trailing slash; call it with `GET` or `HEAD` |
| The byte count from `wc -c` is `12` rather than `11` | A newline was appended to the body | Remove it: the body is exactly `Hello world` with no trailing newline |
| `EADDRINUSE` on a restart you thought had stopped the server | An earlier instance is still running in another terminal | Press `Ctrl-C` in that terminal and start again |
