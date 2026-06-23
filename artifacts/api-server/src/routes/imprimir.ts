import { Router, type IRouter } from "express";
import { z } from "zod/v4";

const router: IRouter = Router();

const ImprimirBody = z.object({
  ticket: z.string().min(1, "ticket requerido"),
  ip: z.string().url("ip debe ser una URL válida (ej: http://10.0.0.100:3000)"),
});

router.post("/imprimir", async (req, res) => {
  const parsed = ImprimirBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { ticket, ip } = parsed.data;
  const target = ip.replace(/\/$/, "") + "/imprimir";

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 12000);

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
      signal: ctrl.signal,
    });
    clearTimeout(timeout);

    const text = await upstream.text();
    if (!upstream.ok) {
      res.status(502).json({ error: `Servidor impresora respondió HTTP ${upstream.status}`, detail: text });
      return;
    }

    try {
      res.json(JSON.parse(text));
    } catch {
      res.json({ ok: true });
    }
  } catch (err: unknown) {
    clearTimeout(timeout);
    const e = err as Error;
    if (e.name === "AbortError") {
      res.status(504).json({ error: "Sin respuesta del servidor de impresión (12 s). Verificá que esté encendido y en la misma red." });
    } else {
      res.status(502).json({ error: `No se pudo conectar a ${ip}: ${e.message}` });
    }
  }
});

export default router;
