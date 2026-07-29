import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mipos.app",
  appName: "Mi POS",
  webDir: "dist/public",
  android: {
    allowMixedContent: false,
    // Permite que la app acceda a la red local (impresora WiFi)
    // El permiso INTERNET está en AndroidManifest.xml
  },
  plugins: {
    // Sin plugins de terceros — usamos nuestro propio TcpPrintPlugin
  },
};

export default config;
