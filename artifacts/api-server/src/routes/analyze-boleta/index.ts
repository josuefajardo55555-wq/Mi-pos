import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/analyze-boleta", async (req, res) => {
  const { url, mimeType, name, type, date } = req.body as {
    url: string;
    mimeType: string;
    name?: string;
    type?: string;
    date?: string;
  };

  if (!url || !mimeType) {
    res.status(400).json({ error: "url y mimeType requeridos" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    res.write(`data: ${JSON.stringify({ error: "Tipo de archivo no soportado para análisis" })}\n\n`);
    res.end();
    return;
  }

  try {
    const prompt = `Analizá este documento comercial (${type ?? "boleta"} de "${name ?? "proveedor desconocido"}", fecha ${date ?? "no especificada"}).

Extraé TODOS los ítems y productos que aparecen. Por cada ítem que identifiques, escribí INMEDIATAMENTE una sola línea JSON con este formato exacto:
{"barcode":"CODIGO_O_VACIO","name":"NOMBRE_DEL_PRODUCTO","qty":CANTIDAD,"unit_price":PRECIO_UNITARIO,"total":PRECIO_TOTAL_LINEA}

REGLAS ESTRICTAS:
- Escribí cada línea JSON en cuanto identifiques el ítem — no esperes a terminar de leer todo el documento
- Sin markdown, sin triple backticks, sin explicaciones — SOLO líneas JSON, una por línea
- Si no hay código de barras visible, usá "" para barcode
- Los precios son números sin símbolo de moneda ni puntos de miles (ej: 1250.50 no "1.250,50")
- Si no podés leer un campo con certeza, usá null
- Cuando hayas encontrado TODOS los ítems, escribí esta línea de cierre:
{"done":true,"subtotal":MONTO_TOTAL_DEL_DOCUMENTO,"items_count":CANTIDAD_TOTAL_ITEMS}

Empezá con el primer ítem ahora.`;

    const contentBlocks: any[] = [];

    if (isImage) {
      contentBlocks.push({ type: "image", source: { type: "url", url } });
    } else {
      contentBlocks.push({ type: "document", source: { type: "url", url } });
    }
    contentBlocks.push({ type: "text", text: prompt });

    const streamParams: any = {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: contentBlocks }],
    };

    if (isPdf) streamParams.betas = ["pdfs-2024-09-25"];

    const stream = isPdf
      ? anthropic.beta.messages.stream(streamParams)
      : anthropic.messages.stream(streamParams);

    let buffer = "";
    let doneSent = false;

    for await (const event of stream as any) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        buffer += event.delta.text;

        // Extract complete newline-terminated lines from the buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep the last incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.done === true) {
              res.write(
                `data: ${JSON.stringify({ done: true, subtotal: parsed.subtotal ?? null, items_count: parsed.items_count ?? null })}\n\n`,
              );
              doneSent = true;
            } else if (parsed.name !== undefined) {
              res.write(`data: ${JSON.stringify({ item: parsed })}\n\n`);
            }
          } catch {
            // Incomplete or non-JSON line — skip
          }
        }
      }
    }

    // Flush any remaining buffer content
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        if (parsed.done === true) {
          res.write(
            `data: ${JSON.stringify({ done: true, subtotal: parsed.subtotal ?? null, items_count: parsed.items_count ?? null })}\n\n`,
          );
          doneSent = true;
        } else if (parsed.name !== undefined) {
          res.write(`data: ${JSON.stringify({ item: parsed })}\n\n`);
        }
      } catch {
        // ignore
      }
    }

    if (!doneSent) {
      res.write(`data: ${JSON.stringify({ done: true, subtotal: null, items_count: null })}\n\n`);
    }

    res.end();
  } catch (err: any) {
    res.write(
      `data: ${JSON.stringify({ error: err.message ?? "Error al analizar el documento" })}\n\n`,
    );
    res.end();
  }
});

export default router;
