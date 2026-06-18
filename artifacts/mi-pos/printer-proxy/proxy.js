// Mi POS — Printer Proxy
// Bridges ws://localhost:9200  →  TCP 10.10.100.254:9100
//
// Setup:
//   1. npm install          (installs the 'ws' package)
//   2. node proxy.js        (leave the terminal open)
//
// The POS app will auto-connect when you print a ticket.

const { WebSocketServer } = require("ws");
const net = require("net");

const WS_PORT      = 9200;
const PRINTER_IP   = "10.10.100.254";
const PRINTER_PORT = 9100;

const wss = new WebSocketServer({ host: "127.0.0.1", port: WS_PORT });

function ts() { return new Date().toLocaleTimeString("es-AR"); }

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Mi POS — Proxy de impresora WiFi");
console.log(`  Escuchando en   ws://localhost:${WS_PORT}`);
console.log(`  Impresora en    ${PRINTER_IP}:${PRINTER_PORT}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Dejá esta ventana abierta mientras usás el POS.");
console.log();

wss.on("connection", (ws, req) => {
  console.log(`[${ts()}] Navegador conectado`);

  ws.on("message", (data) => {
    // data is a Buffer with raw ESC/POS bytes
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const tcp = net.createConnection({ host: PRINTER_IP, port: PRINTER_PORT }, () => {
      tcp.write(buf, () => tcp.destroy());
      console.log(`[${ts()}] ✓ ${buf.length} bytes enviados a la impresora`);
    });
    tcp.on("error", (err) => {
      console.error(`[${ts()}] ✗ Error de impresora: ${err.message}`);
      try { ws.send(JSON.stringify({ error: err.message })); } catch {}
    });
    tcp.setTimeout(5000, () => {
      console.error(`[${ts()}] ✗ Timeout: no responde la impresora`);
      tcp.destroy();
      try { ws.send(JSON.stringify({ error: "Timeout: la impresora no respondió" })); } catch {}
    });
  });

  ws.on("close", () => console.log(`[${ts()}] Navegador desconectado`));
  ws.on("error", (err) => console.error(`[${ts()}] WS error: ${err.message}`));
});

wss.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Error: el puerto ${WS_PORT} ya está en uso. ¿Ya hay una instancia corriendo?`);
  } else {
    console.error("Error del servidor WebSocket:", err.message);
  }
  process.exit(1);
});
