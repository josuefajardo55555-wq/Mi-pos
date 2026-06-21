---
name: Anthropic lib stale build
description: La lib integrations-anthropic-ai no tiene build script; si dist/ no existe falla el typecheck del api-server.
---

## Regla
Si `pnpm run typecheck` en api-server falla con TS6305 ("output file has not been built from source"), compilar la lib manualmente:

```bash
cd lib/integrations-anthropic-ai && npx tsc --build
```

**Why:** La lib es composite pero no tiene `build` script en package.json, entonces `pnpm run typecheck:libs` del root no la compila en ciertos ambientes. La dist/ no está commiteada en el repo.

**How to apply:** Solo es necesario cuando `dist/` está vacío o ausente (primer checkout, repo limpio). Después de compilar una vez, los builds incrementales de `tsc --build` en el root sí funcionan.
