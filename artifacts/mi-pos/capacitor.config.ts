import type { CapacitorConfig } from "@capacitor/cli";

// ─── URL de producción ────────────────────────────────────────────────────────
// Pegá aquí la URL de tu app publicada en Replit (ej: https://mi-pos.tuusuario.replit.app)
// La APK va a cargar siempre la versión más reciente cuando tenga wifi,
// y usar la versión instalada cuando esté offline.
// Dejalo en null para usar solo el bundle local (sin actualizaciones automáticas).
const PRODUCTION_URL: string | null = "https://pos-update--josuequispe98.replit.app";
// Ejemplo: const PRODUCTION_URL = "https://mi-pos.tuusuario.replit.app";

const config: CapacitorConfig = {
  appId: "com.mipos.app",
  appName: "Mi POS",
  webDir: "dist/public",

  // Si hay URL de producción, la APK la usa cuando tiene internet
  ...(PRODUCTION_URL
    ? {
        server: {
          url: PRODUCTION_URL,
          cleartext: false, // solo HTTPS
        },
      }
    : {}),

  android: {
    allowMixedContent: false,
  },
};

export default config;
