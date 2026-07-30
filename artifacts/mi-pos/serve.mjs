// Servidor de producción para Mi POS — sin dependencias externas
// Sirve dist/public con Cache-Control: no-store en index.html
// para que el APK siempre cargue el JS actualizado al abrir la app

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "dist/public");
const PORT   = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".mjs":  "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".png":  "image/png",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function serveFile(res, filePath, isAsset) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return null;
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    const headers = { "Content-Type": mime };
    if (ext === ".html") {
      // HTML nunca se cachea — el APK siempre pide el más reciente
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
      headers["Pragma"]  = "no-cache";
      headers["Expires"] = "0";
    } else if (isAsset) {
      // Archivos en /assets/ tienen hash en el nombre → cache permanente
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else {
      headers["Cache-Control"] = "no-cache";
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
    return true;
  });
}

http.createServer((req, res) => {
  let url = req.url.split("?")[0];          // ignorar query strings
  if (url === "/") url = "/index.html";

  const isAsset = url.startsWith("/assets/");
  const filePath = path.join(PUBLIC, url);

  // Intentar servir el archivo pedido
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      const ext  = path.extname(filePath).toLowerCase();
      const mime = MIME[ext] || "application/octet-stream";
      const headers = { "Content-Type": mime };
      if (ext === ".html") {
        headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
        headers["Pragma"]  = "no-cache";
        headers["Expires"] = "0";
      } else if (isAsset) {
        headers["Cache-Control"] = "public, max-age=31536000, immutable";
      } else {
        headers["Cache-Control"] = "no-cache";
      }
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    } else {
      // SPA fallback: cualquier ruta desconocida → index.html (sin cache)
      const index = path.join(PUBLIC, "index.html");
      fs.readFile(index, (err2, data) => {
        if (err2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        });
        res.end(data);
      });
    }
  });
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Mi POS production server listening on port ${PORT}`);
});
