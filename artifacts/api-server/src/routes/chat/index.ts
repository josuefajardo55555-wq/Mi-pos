import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

function buildSystemPrompt(ctx: {
  bizName: string;
  products: any[];
  sales: any[];
  userRole: string;
}): string {
  const now = new Date();
  const today = now.toLocaleDateString("es-AR");
  const todayStr = now.toISOString().split("T")[0];

  const parseSaleDate = (s: any): Date | null => {
    try {
      if (s.date?.seconds) return new Date(s.date.seconds * 1000);
      if (s.date) return new Date(s.date);
    } catch {}
    return null;
  };

  const todaySales = ctx.sales.filter((s) => {
    const d = parseSaleDate(s);
    return d && d.toISOString().split("T")[0] === todayStr;
  });

  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const weekSales = ctx.sales.filter((s) => { const d = parseSaleDate(s); return d && d >= weekAgo; });
  const monthSales = ctx.sales.filter((s) => { const d = parseSaleDate(s); return d && d >= monthAgo; });

  const sumTotal = (arr: any[]) => arr.reduce((s, v) => s + (v.total || 0), 0);
  const fmt = (n: number) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const methodCount: Record<string, number> = {};
  ctx.sales.forEach((s) => { const k = s.method || "Desconocido"; methodCount[k] = (methodCount[k] || 0) + 1; });

  const hourCount: Record<number, number> = {};
  ctx.sales.forEach((s) => { const d = parseSaleDate(s); if (d) { const h = d.getHours(); hourCount[h] = (hourCount[h] || 0) + 1; } });
  const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const dayCount: Record<number, number> = {};
  ctx.sales.forEach((s) => { const d = parseSaleDate(s); if (d) { const day = d.getDay(); dayCount[day] = (dayCount[day] || 0) + 1; } });
  const peakDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

  const productTotals: Record<string, { name: string; qty: number; revenue: number }> = {};
  ctx.sales.forEach((s) => {
    (s.items || []).forEach((item: any) => {
      const key = item.id || item.name;
      if (!productTotals[key]) productTotals[key] = { name: item.name, qty: 0, revenue: 0 };
      productTotals[key].qty += item.qty || 0;
      productTotals[key].revenue += (item.price || 0) * (item.qty || 0);
    });
  });
  const sortedProducts = Object.values(productTotals).sort((a, b) => b.qty - a.qty);

  const lowStock = ctx.products.filter((p) => p.stock < (p.minStock ?? 6));
  const outOfStock = ctx.products.filter((p) => p.stock <= 0);
  const inventoryValue = ctx.products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);
  const avgTicket = ctx.sales.length > 0 ? sumTotal(ctx.sales) / ctx.sales.length : 0;
  const avgTicketToday = todaySales.length > 0 ? sumTotal(todaySales) / todaySales.length : 0;

  return `Eres el Asistente de ${ctx.bizName}, experto en punto de venta para comercios argentinos.
Responde siempre en español, de forma concisa y útil para un comerciante. Usa pesos argentinos ($).
Hoy es ${today}. Rol del usuario: ${ctx.userRole}.

DATOS EN TIEMPO REAL DEL NEGOCIO
════════════════════════════════════

VENTAS HOY (${today})
• Transacciones: ${todaySales.length}
• Total: ${fmt(sumTotal(todaySales))}
• Ticket promedio hoy: ${fmt(avgTicketToday)}

VENTAS ÚLTIMA SEMANA
• Transacciones: ${weekSales.length} | Total: ${fmt(sumTotal(weekSales))}

VENTAS ÚLTIMO MES
• Transacciones: ${monthSales.length} | Total: ${fmt(sumTotal(monthSales))}

HISTÓRICO TOTAL
• Transacciones: ${ctx.sales.length} | Total: ${fmt(sumTotal(ctx.sales))}
• Ticket promedio general: ${fmt(avgTicket)}

MÉTODOS DE PAGO
${Object.entries(methodCount).map(([m, c]) => `• ${m}: ${c} ventas`).join("\n") || "Sin datos"}

HORARIO PICO
${peakHour ? `• ${peakHour[0]}:00 hs (${peakHour[1]} ventas)` : "Sin datos suficientes"}

DÍA DE LA SEMANA MÁS ACTIVO
${peakDay ? `• ${dayNames[Number(peakDay[0])]} (${peakDay[1]} ventas)` : "Sin datos suficientes"}

TOP 5 PRODUCTOS MÁS VENDIDOS
${sortedProducts.slice(0, 5).map((p, i) => `${i + 1}. ${p.name}: ${p.qty} uds | ${fmt(p.revenue)}`).join("\n") || "Sin ventas registradas"}

PRODUCTOS MENOS VENDIDOS
${sortedProducts.slice(-3).reverse().map((p) => `• ${p.name}: ${p.qty} uds`).join("\n") || "Sin datos"}

INVENTARIO
• Total productos: ${ctx.products.length}
• Valor total: ${fmt(inventoryValue)}
• Stock bajo (< mínimo): ${lowStock.length}
${lowStock.map((p) => `  - ${p.name}: ${p.stock} uds`).join("\n") || "  Ninguno"}
• Sin stock: ${outOfStock.length}
${outOfStock.map((p) => `  - ${p.name}`).join("\n") || "  Ninguno"}

CATÁLOGO COMPLETO
${ctx.products.map((p) => `• ${p.name} | Stock: ${p.stock} | Precio: ${fmt(p.price)} | Cat: ${p.category || "-"}`).join("\n") || "Sin productos"}

Responde directo y útil. Si el usuario pregunta algo fuera de los datos disponibles, indicalo.`;
}

router.post("/chat", async (req, res) => {
  const body = req.body as any;
  const messages: Array<{ role: "user" | "assistant"; content: string }> = body?.messages;
  const ctx = body?.businessContext;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages requerido" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const systemPrompt = buildSystemPrompt({
      bizName: ctx?.bizName || "MI POS",
      products: Array.isArray(ctx?.products) ? ctx.products : [],
      sales: Array.isArray(ctx?.sales) ? ctx.sales : [],
      userRole: ctx?.userRole || "owner",
    });

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message || "Error al contactar la IA" })}\n\n`);
    res.end();
  }
});

export default router;
