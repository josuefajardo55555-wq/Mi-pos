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
    res.write(`data: ${JSON.stringify({ error: "Tipo de archivo no soportado" })}\n\n`);
    res.end();
    return;
  }

  try {
    const prompt = `Analizás un documento comercial (${type ?? "boleta"} de "${name ?? "proveedor"}", referencia de fecha ${date ?? "no especificada"}).

Extraé dos cosas únicamente:
1. La FECHA DE EMISIÓN del documento (la que figura en la boleta/factura, no la de hoy).
2. Por cada ítem o producto que aparezca en el documento, su nombre, código de barras (si es visible) y precio unitario.

Por cada ítem que encuentres, escribí INMEDIATAMENTE una línea JSON con este formato exacto:
{"barcode":"CODIGO_O_VACIO","name":"NOMBRE_DEL_PRODUCTO","price":PRECIO_UNITARIO}

Cuando hayas recorrido todos los ítems, escribí esta línea de cierre:
{"done":true,"doc_date":"YYYY-MM-DD","items_count":N}

REGLAS ESTRICTAS:
- Solo líneas JSON, sin markdown, sin backticks, sin texto explicativo
- barcode: string vacío "" si no hay código visible
- price: número sin símbolo de moneda ni separadores de miles (ej: 1250 no "$1.250,00")
- doc_date: en formato YYYY-MM-DD, o null si no encontrás ninguna fecha en el documento
- Emitir cada línea apenas identificás el ítem, sin esperar al final`;

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

    const stream = anthropic.messages.stream(streamParams);

    let buffer = "";
    let doneSent = false;

    for await (const event of stream as any) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        buffer += event.delta.text;

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.done === true) {
              res.write(
                `data: ${JSON.stringify({ done: true, doc_date: parsed.doc_date ?? null, items_count: parsed.items_count ?? null })}\n\n`,
              );
              doneSent = true;
            } else if (parsed.name !== undefined) {
              res.write(`data: ${JSON.stringify({ item: parsed })}\n\n`);
            }
          } catch {
            // incomplete line
          }
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        if (parsed.done === true) {
          res.write(
            `data: ${JSON.stringify({ done: true, doc_date: parsed.doc_date ?? null, items_count: parsed.items_count ?? null })}\n\n`,
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
      res.write(`data: ${JSON.stringify({ done: true, doc_date: null, items_count: null })}\n\n`);
    }

    res.end();
  } catch (err: any) {
    res.write(
      `data: ${JSON.stringify({ error: err.message ?? "Error al analizar" })}\n\n`,
    );
    res.end();
  }
});

export default router;
