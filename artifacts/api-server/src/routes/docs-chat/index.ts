import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/docs-chat", async (req, res) => {
  const { messages, documents = [] } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    documents: Array<{ url: string; type: string; name: string; date: string; mimeType: string }>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages requerido" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const imgDocs = documents
      .filter((d) => d.mimeType?.startsWith("image/"))
      .slice(0, 10);
    const pdfDocs = documents
      .filter((d) => d.mimeType === "application/pdf")
      .slice(0, 5);

    const docSummary =
      documents
        .map(
          (d, i) =>
            `${i + 1}. [${d.type}] "${d.name || "Sin nombre"}" | Fecha: ${d.date} | ${d.mimeType?.includes("pdf") ? "PDF" : "Imagen"}`,
        )
        .join("\n") || "Ninguno cargado aún.";

    const system = `Sos el asistente de documentos de Mi POS. Analizás documentos comerciales (boletas, remitos, recibos) subidos por el comerciante para responder preguntas sobre gastos, proveedores y fechas. Respondé siempre en español argentino, de forma concisa y útil para un comerciante.

DOCUMENTOS DISPONIBLES (${documents.length} total):
${docSummary}

Las imágenes de los documentos están adjuntas en el mensaje. Usálas para responder con precisión. Si el comerciante pregunta por un monto, proveedor o fecha, buscá en los documentos visibles.`;

    // Build Claude messages — prepend all images/PDFs to the last user message
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");

    const apiMessages = await Promise.all(
      messages.map(async (m, idx) => {
        if (idx !== lastUserIdx) return { role: m.role, content: m.content };

        const contentBlocks: any[] = [];

        // Attach image documents as vision blocks
        for (const doc of imgDocs) {
          contentBlocks.push({
            type: "text",
            text: `📋 ${doc.type} — ${doc.name || "Sin nombre"} — ${doc.date}:`,
          });
          contentBlocks.push({
            type: "image",
            source: { type: "url", url: doc.url },
          });
        }

        // Attach PDF documents as document blocks
        for (const doc of pdfDocs) {
          contentBlocks.push({
            type: "text",
            text: `📄 ${doc.type} — ${doc.name || "Sin nombre"} — ${doc.date} (PDF):`,
          });
          contentBlocks.push({
            type: "document",
            source: { type: "url", url: doc.url },
          });
        }

        contentBlocks.push({ type: "text", text: m.content });
        return { role: m.role, content: contentBlocks };
      }),
    );

    const hasPdfs = pdfDocs.length > 0;
    const streamParams: any = {
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: apiMessages,
    };
    if (hasPdfs) {
      streamParams.betas = ["pdfs-2024-09-25"];
    }

    const stream = hasPdfs
      ? anthropic.beta.messages.stream(streamParams)
      : anthropic.messages.stream(streamParams);

    for await (const event of stream as any) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(
      `data: ${JSON.stringify({ error: err.message || "Error al contactar la IA" })}\n\n`,
    );
    res.end();
  }
});

export default router;
