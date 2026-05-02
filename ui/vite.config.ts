import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

function normalizeBase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "/";
  }
  if (trimmed === "./") {
    return "./";
  }
  if (trimmed.endsWith("/")) {
    return trimmed;
  }
  return `${trimmed}/`;
}

export default defineConfig(() => {
  const envBase = process.env.OPENCLAW_CONTROL_UI_BASE_PATH?.trim();
  const base = envBase ? normalizeBase(envBase) : "./";
  return {
    base,
    publicDir: path.resolve(here, "public"),
    define: {
      // Browser-safe stubs for Node.js `process` globals that leak into the
      // bundle through shared infra modules (home-dir, exec-approvals, etc.).
      // These are compile-time replacements — Vite inlines the values below.
      "process.env": "{}",
      "process.cwd": '(function() { return "/" })',
      "process.platform": '"darwin"',
      "process.argv": '["",""]',
      "process.pid": "0",
      "process.execPath": '""',
      "process.execArgv": "[]",
    },
    optimizeDeps: {
      include: ["lit/directives/repeat.js"],
    },
    build: {
      outDir: path.resolve(here, "../dist/control-ui"),
      emptyOutDir: true,
      sourcemap: true,
      // Keep CI/onboard logs clean; current control UI chunking is intentionally above 500 kB.
      chunkSizeWarningLimit: 1024,
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
    plugins: [
      {
        name: "control-ui-dev-stubs",
        configureServer(server) {
          server.middlewares.use("/__openclaw/control-ui-config.json", (_req, res) => {
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                basePath: "/",
                assistantName: "",
                assistantAvatar: "",
              }),
            );
          });
        },
      },
      {
        // Browser polyfill for `node:os` — shared infra modules (bundled-dir,
        // home-dir, etc.) call os.tmpdir() / os.homedir() which have no runtime
        // in the browser.  Provide a minimal shim so the Control UI bundle
        // initialises without crashing.
        name: "control-ui-node-os-polyfill",
        enforce: "pre",
        resolveId(source) {
          if (source === "node:os" || source === "os") {
            return "\0virtual:node-os";
          }
        },
        load(id) {
          if (id === "\0virtual:node-os") {
            return `
function tmpdir() { return "/tmp"; }
function homedir() { return "/home/user"; }
function platform() { return "browser"; }
function type() { return "Browser"; }
function arch() { return ""; }
function release() { return ""; }
function cpus() { return []; }
function totalmem() { return 0; }
function freemem() { return 0; }
function uptime() { return 0; }
function hostname() { return "localhost"; }
function userInfo() { return { username: "user", homedir: "/home/user", shell: null }; }
const EOL = "\\n";
export default { tmpdir, homedir, platform, type, arch, release, cpus, totalmem, freemem, uptime, hostname, userInfo, EOL };
export { tmpdir, homedir, platform, type, arch, release, cpus, totalmem, freemem, uptime, hostname, userInfo, EOL };
`;
          }
        },
      },
      {
        // Browser polyfill for `node:fs` — shared infra modules (paths,
        // home-dir, exec-approvals, etc.) call existsSync / readFileSync
        // which have no runtime in the browser.  Provide a minimal shim so
        // the Control UI bundle initialises without crashing.
        name: "control-ui-node-fs-polyfill",
        enforce: "pre",
        resolveId(source) {
          if (source === "node:fs" || source === "fs") {
            return "\0virtual:node-fs";
          }
        },
        load(id) {
          if (id === "\0virtual:node-fs") {
            return `
// Sync operations return safe defaults (file does not exist, empty content, etc.)
function existsSync() { return false; }
function readFileSync() { return ""; }
function writeFileSync() {}
function mkdirSync() {}
function readdirSync() { return []; }
function statSync() { throw new Error("ENOENT: no such file"); }
function lstatSync() { throw new Error("ENOENT: no such file"); }
function unlinkSync() {}
function accessSync() {}
function appendFileSync() {}
function copyFileSync() {}
function renameSync() {}
function rmdirSync() {}
function chmodSync() {}
function readlinkSync() { return ""; }
function symlinkSync() {}
function realpathSync(p) { return p; }
function truncateSync() {}
function utimesSync() {}
function ftruncateSync() {}
function fsyncSync() {}
function closeSync() {}
function openSync() { return -1; }
function readSync() { return 0; }
function writeSync() { return 0; }
// Async stubs — return rejected promises so callers fall back gracefully
function readFile() { return Promise.reject(new Error("ENOENT")); }
function writeFile() { return Promise.resolve(); }
function mkdir() { return Promise.resolve(); }
function readdir() { return Promise.resolve([]); }
function stat() { return Promise.reject(new Error("ENOENT")); }
function lstat() { return Promise.reject(new Error("ENOENT")); }
function unlink() { return Promise.resolve(); }
function access() { return Promise.reject(new Error("ENOENT")); }
function appendFile() { return Promise.resolve(); }
function copyFile() { return Promise.resolve(); }
function rename() { return Promise.resolve(); }
function rmdir() { return Promise.resolve(); }
function chmod() { return Promise.resolve(); }
function readlink() { return Promise.reject(new Error("ENOENT")); }
function symlink() { return Promise.resolve(); }
function realpath(p) { return Promise.resolve(p); }
function truncate() { return Promise.resolve(); }
function utimes() { return Promise.resolve(); }
function ftruncate() { return Promise.resolve(); }
function fsync() { return Promise.resolve(); }
function close() { return Promise.resolve(); }
function open() { return Promise.resolve(-1); }
// Constants
const F_OK = 0, R_OK = 4, W_OK = 2, X_OK = 1;
const O_RDONLY = 0, O_WRONLY = 1, O_RDWR = 2, O_CREAT = 64;
const promises = {};
export default {
  existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync,
  statSync, lstatSync, unlinkSync, accessSync, appendFileSync,
  copyFileSync, renameSync, rmdirSync, chmodSync, readlinkSync,
  symlinkSync, realpathSync, truncateSync, utimesSync, ftruncateSync,
  fsyncSync, closeSync, openSync, readSync, writeSync,
  readFile, writeFile, mkdir, readdir, stat, lstat, unlink,
  access, appendFile, copyFile, rename, rmdir, chmod, readlink,
  symlink, realpath, truncate, utimes, ftruncate, fsync, close, open,
  F_OK, R_OK, W_OK, X_OK, O_RDONLY, O_WRONLY, O_RDWR, O_CREAT,
  promises,
};
export {
  existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync,
  statSync, lstatSync, unlinkSync, accessSync, appendFileSync,
  copyFileSync, renameSync, rmdirSync, chmodSync, readlinkSync,
  symlinkSync, realpathSync, truncateSync, utimesSync, ftruncateSync,
  fsyncSync, closeSync, openSync, readSync, writeSync,
  readFile, writeFile, mkdir, readdir, stat, lstat, unlink,
  access, appendFile, copyFile, rename, rmdir, chmod, readlink,
  symlink, realpath, truncate, utimes, ftruncate, fsync, close, open,
  F_OK, R_OK, W_OK, X_OK, O_RDONLY, O_WRONLY, O_RDWR, O_CREAT,
  promises,
};
`;
          }
        },
      },
      {
        // Browser polyfill for `node:module` — semver.runtime.ts calls
        // `createRequire` which has no runtime in the browser.  Provide a
        // minimal shim so the Control UI bundle initialises without crashing.
        name: "control-ui-node-module-polyfill",
        enforce: "pre",
        resolveId(source) {
          if (source === "node:module" || source === "module") {
            return "\0virtual:node-module";
          }
        },
        load(id) {
          if (id === "\0virtual:node-module") {
            return `
function createRequire() { return function require() { return {}; }; }
const Module = { _cache: {}, _pathCache: {}, _extensions: {}, _debug: () => {}, builtinModules: [] };
Module.prototype = { require: function() { return {}; }, _compile: function() {}, load: function() {} };
Module._nodeRequirements = {};
Module.createRequire = createRequire;
export { createRequire, Module };
export default { createRequire, Module };
`;
          }
        },
      },
      {
        // Browser catch-all polyfill for any remaining `node:*` built-ins
        // that leak into the bundle from shared infra modules.  Returns an
        // empty module with a default export so callers don't crash.
        name: "control-ui-node-catchall-polyfill",
        enforce: "pre",
        resolveId(source) {
          if (typeof source === "string" && source.startsWith("node:")) {
            // Already handled by specific polyfills above — skip
            if (
              source === "node:os" ||
              source === "node:fs" ||
              source === "node:path" ||
              source === "node:module"
            ) {
              return null;
            }
            return `\0virtual:node-catchall:${source}`;
          }
        },
        load(id) {
          if (typeof id === "string" && id.startsWith("\0virtual:node-catchall:")) {
            // Extract the module name (e.g. "node:url" from the virtual id)
            const source = id.slice("\0virtual:node-catchall:".length);

            // Module-specific named exports — only what the Control UI bundle
            // actually imports.  Fallback via Proxy for anything else.
            const perModule: Record<string, string[]> = {
              "node:url": [
                `export const fileURLToPath = (u) => String(u).replace('file://', '');`,
                `export const pathToFileURL = (p) => new URL('file://' + p);`,
                `export const URL = globalThis.URL;`,
                `export const URLSearchParams = globalThis.URLSearchParams;`,
              ],
              "node:crypto": [
                `export const createHash = () => ({ update: () => ({ digest: () => '' }) });`,
                `export const randomBytes = (n) => new Uint8Array(n);`,
                `export const createHmac = () => ({ update: () => ({ digest: () => '' }) });`,
              ],
              "node:child_process": [
                `export const spawn = () => ({ on: () => {}, kill: () => {} });`,
                `export const spawnSync = () => ({ status: 0, stdout: '', stderr: '' });`,
                `export const exec = () => {};`,
                `export const execSync = () => '';`,
                `export const fork = () => ({ on: () => {}, kill: () => {} });`,
              ],
              "node:stream": [
                `export const Readable = class { on() { return this; } pipe() { return this; } };`,
                `export const Writable = class { write() {} end() {} };`,
                `export const Transform = class { on() { return this; } pipe() { return this; } };`,
                `export const PassThrough = class { on() { return this; } pipe() { return this; } };`,
              ],
              "node:events": [
                `export const EventEmitter = class { on() { return this; } emit() { return false; } off() { return this; } once() { return this; } };`,
              ],
              "node:util": [
                `export const promisify = (fn) => fn;`,
                `export const callbackify = (fn) => fn;`,
                `export const inspect = (v) => String(v);`,
                `export const isDeepStrictEqual = () => false;`,
              ],
              "node:buffer": [
                `export const Buffer = globalThis.Buffer ?? { from: () => {}, alloc: () => {}, isBuffer: () => false };`,
              ],
              "node:string_decoder": [
                `export const StringDecoder = class { write(s) { return s; } end() { return ''; } };`,
              ],
            };

            const namedExports = perModule[source] ?? [];
            return [
              `const _p = new Proxy({}, { get: (_, k) => k === 'default' ? {} : () => {} });`,
              `export default _p;`,
              ...namedExports,
            ].join("\n");
          }
        },
      },
      {
        // Browser polyfill for `node:path` — shared infra modules (home-dir,
        // exec-approvals, etc.) import `path.resolve` / `path.join` which have
        // no runtime in the browser.  Provide a minimal POSIX-compatible shim
        // so the Control UI bundle initialises without crashing.
        name: "control-ui-node-path-polyfill",
        enforce: "pre",
        resolveId(source) {
          if (source === "node:path" || source === "path") {
            return "\0virtual:node-path";
          }
        },
        load(id) {
          if (id === "\0virtual:node-path") {
            return `
const posixSep = "/";
function normalize(p) {
  if (p === "") return ".";
  const isAbs = p.charCodeAt(0) === 47;
  const trailing = p.charCodeAt(p.length - 1) === 47;
  let segs = p.split(/\\/+/, 64).filter(Boolean);
  const out = [];
  for (const s of segs) {
    if (s === ".") continue;
    if (s === "..") { out.pop(); continue; }
    out.push(s);
  }
  let result = out.join(posixSep);
  if (isAbs) result = posixSep + result;
  if (trailing && result !== "/") result += posixSep;
  return result || ".";
}
function resolve(...args) {
  let resolved = "";
  for (const a of args) {
    if (typeof a !== "string") continue;
    if (a.charCodeAt(0) === 47) { resolved = a; continue; }
    resolved = resolved ? resolved + posixSep + a : a;
  }
  return normalize(resolved || "/");
}
function join(...args) {
  return resolve(...args);
}
function dirname(p) {
  const n = normalize(p);
  const i = n.lastIndexOf(posixSep);
  return i <= 0 ? (i === 0 ? posixSep : ".") : n.slice(0, i);
}
function basename(p, ext) {
  const n = normalize(p);
  const i = n.lastIndexOf(posixSep);
  let b = i < 0 ? n : n.slice(i + 1);
  if (ext && b.endsWith(ext)) b = b.slice(0, -ext.length);
  return b;
}
function extname(p) {
  const b = basename(p);
  const i = b.lastIndexOf(".");
  return i > 0 ? b.slice(i) : "";
}
const sep = posixSep;
export default { normalize, resolve, join, dirname, basename, extname, sep };
export { normalize, resolve, join, dirname, basename, extname, sep, posixSep };
`;
          }
        },
      },
    ],
  };
});
