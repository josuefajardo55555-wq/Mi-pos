package com.mipos.app.plugins;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;

/**
 * TcpPrintPlugin — abre un socket TCP a la impresora y envía bytes ESC/POS.
 * Evita el proxy WebSocket que se necesita en la web.
 *
 * Uso desde JS:
 *   TcpPrint.print({ ip: "192.168.1.50", port: 9100, data: [0x1B, 0x40, ...] })
 */
@CapacitorPlugin(name = "TcpPrint")
public class TcpPrintPlugin extends Plugin {

    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int SO_TIMEOUT_MS = 8000;

    @PluginMethod
    public void print(PluginCall call) {
        String ip = call.getString("ip", "");
        int port   = call.getInt("port", 9100);
        JSArray data = call.getArray("data");

        if (ip.isEmpty()) {
            call.reject("ip es requerido");
            return;
        }
        if (data == null || data.length() == 0) {
            call.reject("data es requerido y no puede estar vacío");
            return;
        }

        // Copiar datos antes del hilo para evitar problemas de acceso concurrente
        final byte[] bytes;
        try {
            bytes = new byte[data.length()];
            for (int i = 0; i < data.length(); i++) {
                bytes[i] = (byte) data.getInt(i);
            }
        } catch (Exception e) {
            call.reject("Error al leer datos: " + e.getMessage());
            return;
        }

        final String finalIp = ip;
        final int finalPort  = port;

        new Thread(() -> {
            Socket socket = null;
            try {
                socket = new Socket();
                socket.connect(new InetSocketAddress(finalIp, finalPort), CONNECT_TIMEOUT_MS);
                socket.setSoTimeout(SO_TIMEOUT_MS);
                OutputStream out = socket.getOutputStream();
                out.write(bytes);
                out.flush();
                call.resolve();
            } catch (java.net.ConnectException e) {
                call.reject("No se pudo conectar a " + finalIp + ":" + finalPort + ". Verificá que la impresora esté encendida y en la misma red.");
            } catch (java.net.SocketTimeoutException e) {
                call.reject("Timeout: la impresora en " + finalIp + " no respondió en " + (CONNECT_TIMEOUT_MS / 1000) + "s.");
            } catch (Exception e) {
                call.reject("Error al imprimir: " + e.getMessage());
            } finally {
                if (socket != null) {
                    try { socket.close(); } catch (Exception ignored) {}
                }
            }
        }).start();
    }
}
