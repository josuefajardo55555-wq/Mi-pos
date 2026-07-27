import { Router, type IRouter } from "express";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const router: IRouter = Router();

/**
 * POST /api/backup-inventory
 * Body: { products: [...], localId: string }
 *
 * Saves a timestamped JSON backup to .local/backups/ (workspace root, outside
 * the app artifacts) and returns the file path so the caller can confirm.
 */
router.post("/backup-inventory", (req, res) => {
  try {
    const { products, localId } = req.body as {
      products: unknown[];
      localId?: string;
    };

    if (!Array.isArray(products)) {
      res.status(400).json({ error: "Se esperaba un array de productos." });
      return;
    }

    const backupDir = join(process.cwd(), "..", "..", ".local", "backups");
    mkdirSync(backupDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const prefix = localId ? `${localId}_` : "";
    const filename = `inventario_${prefix}${stamp}.json`;
    const filepath = join(backupDir, filename);

    writeFileSync(filepath, JSON.stringify(products, null, 2), "utf-8");

    res.json({ ok: true, file: filepath, count: products.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
