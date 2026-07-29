package com.mipos.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.mipos.app.plugins.TcpPrintPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registrar plugins nativos antes de super.onCreate
        registerPlugin(TcpPrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
