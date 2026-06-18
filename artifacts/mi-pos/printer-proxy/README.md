# Mi POS — Printer Proxy

Pequeño script Node.js que conecta la app web con la impresora WiFi ESC/POS.

## ¿Por qué es necesario?

La app corre en HTTPS. Los navegadores no pueden abrir conexiones TCP directas a impresoras locales.
Este script crea un puente:

```
App (HTTPS) → ws://localhost:9200 → TCP → 192.168.100.84:9100 → OCOM OCPP-80K
```

## Configuración de la impresora

| Parámetro | Valor |
|-----------|-------|
| Modelo    | OCOM OCPP-80K-URLW |
| IP        | 192.168.100.84 |
| Puerto    | 9100 (RAW TCP) |
| Papel     | 80 mm |
| Protocolo | ESC/POS |

Para cambiar la IP o el puerto, editá las primeras líneas de `proxy.js`.

## Instalación (primera vez)

Necesitás Node.js instalado en tu PC. Después:

```bash
cd printer-proxy
npm install
```

## Uso diario

```bash
cd printer-proxy
node proxy.js
```

Dejá la ventana abierta. La app se conecta automáticamente al imprimir.

## Solución de problemas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| "No se pudo conectar al proxy" | proxy.js no está corriendo | Ejecutá `node proxy.js` |
| "Error de impresora: ECONNREFUSED" | La impresora está apagada o cambió de IP | Verificá que la impresora esté encendida y en red |
| "Timeout" | La impresora no responde en 5 segundos | Verificá la conexión WiFi de la impresora |
| Puerto 9200 en uso | Ya hay una instancia corriendo | Cerrá la otra o cambiá `WS_PORT` en proxy.js |
