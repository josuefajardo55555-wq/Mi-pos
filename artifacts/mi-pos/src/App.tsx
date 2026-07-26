// @ts-nocheck
import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import { db, auth, storage } from "./firebase";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, addDoc,
  serverTimestamp, query, orderBy, updateDoc, getDocs, getDoc
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CATEGORIES = ["Todas", "Lácteos", "Básicos", "Aceites", "Panadería", "Snacks", "Enlatados", "Bebidas", "Frutas y Verd.", "Higiene", "Limpieza"];
const fmt = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LOCALS = [
  { id: "local1",          name: "Local 1" },
  { id: "local-godoy-cruz", name: "Local Godoy Cruz" },
];

const LocalCtx = createContext("local1");

const INITIAL_PRODUCTS = [
  { id: "p1", name: "Leche La Serenísima 1L", category: "Lácteos", type: "unit", price: 850, stock: 30, unit: "pza", barcode: "7790070010015", img: "" },
  { id: "p2", name: "Yogur Ser Natural 190g", category: "Lácteos", type: "unit", price: 430, stock: 24, unit: "pza", barcode: "7790070040012", img: "" },
  { id: "p3", name: "Queso Cremoso La Paulina", category: "Lácteos", type: "kg", price: 4200, stock: 5, unit: "kg", barcode: "", img: "" },
  { id: "p4", name: "Aceite Natura Girasol 1.5L", category: "Aceites", type: "unit", price: 1850, stock: 25, unit: "pza", barcode: "7790788010018", img: "" },
  { id: "p5", name: "Arroz Marolio 1kg", category: "Básicos", type: "unit", price: 650, stock: 40, unit: "pza", barcode: "7790430000019", img: "" },
  { id: "p6", name: "Fideos Matarazzo 500g", category: "Básicos", type: "unit", price: 420, stock: 35, unit: "pza", barcode: "7790895000016", img: "" },
  { id: "p7", name: "Harina 000 Cañuelas 1kg", category: "Básicos", type: "unit", price: 480, stock: 30, unit: "pza", barcode: "7790380000017", img: "" },
  { id: "p8", name: "Azúcar Ledesma 1kg", category: "Básicos", type: "unit", price: 550, stock: 40, unit: "pza", barcode: "7790450000013", img: "" },
  { id: "p9", name: "Yerba Cruz de Malta 1kg", category: "Bebidas", type: "unit", price: 1650, stock: 20, unit: "pza", barcode: "7790110000011", img: "" },
  { id: "p10", name: "Coca-Cola 2.25L", category: "Bebidas", type: "unit", price: 1200, stock: 18, unit: "pza", barcode: "7790895010015", img: "" },
  { id: "p11", name: "Agua Villavicencio 1.5L", category: "Bebidas", type: "unit", price: 450, stock: 30, unit: "pza", barcode: "7790100000012", img: "" },
  { id: "p12", name: "Manzana", category: "Frutas y Verd.", type: "kg", price: 800, stock: 20, unit: "kg", barcode: "", img: "" },
  { id: "p13", name: "Banana", category: "Frutas y Verd.", type: "kg", price: 650, stock: 15, unit: "kg", barcode: "", img: "" },
  { id: "p14", name: "Tomate", category: "Frutas y Verd.", type: "kg", price: 900, stock: 10, unit: "kg", barcode: "", img: "" },
  { id: "p15", name: "Papa", category: "Frutas y Verd.", type: "kg", price: 550, stock: 25, unit: "kg", barcode: "", img: "" },
  { id: "p16", name: "Shampoo Elvive 400ml", category: "Higiene", type: "unit", price: 1850, stock: 12, unit: "pza", barcode: "7509546054927", img: "" },
  { id: "p17", name: "Jabón Dove 90g", category: "Higiene", type: "unit", price: 680, stock: 20, unit: "pza", barcode: "7791293020011", img: "" },
  { id: "p18", name: "Pasta dental Colgate 90g", category: "Higiene", type: "unit", price: 750, stock: 18, unit: "pza", barcode: "7509546675932", img: "" },
  { id: "p19", name: "Papel higiénico Elite x4", category: "Higiene", type: "unit", price: 980, stock: 20, unit: "pza", barcode: "7790290000016", img: "" },
  { id: "p20", name: "Detergente Magistral 750ml", category: "Limpieza", type: "unit", price: 780, stock: 20, unit: "pza", barcode: "7790150000013", img: "" },
  { id: "p21", name: "Lavandina Ayudín 1L", category: "Limpieza", type: "unit", price: 480, stock: 25, unit: "pza", barcode: "7790160000012", img: "" },
  { id: "p22", name: "Jabón en polvo Ala 800g", category: "Limpieza", type: "unit", price: 1100, stock: 15, unit: "pza", barcode: "7791293040019", img: "" },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #1a1f2e; color: #e8eaf0; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #3a4158; border-radius: 3px; }
  .app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .top-header { padding: 10px 14px; border-bottom: 1px solid #2a3045; display: flex; align-items: center; gap: 10px; background: #1e2438; flex-shrink: 0; }
  .logo { width: 32px; height: 32px; background: linear-gradient(135deg, #00c896, #00a87a); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: #fff; flex-shrink: 0; }
  .top-header h1 { font-size: 14px; font-weight: 700; }
  .role-badge { margin-left: auto; font-size: 10px; padding: 3px 8px; border-radius: 99px; font-weight: 600; }
  .role-owner { background: #fbbf2422; color: #fbbf24; border: 1px solid #fbbf2444; }
  .role-collab { background: #60a5fa22; color: #60a5fa; border: 1px solid #60a5fa44; }
  .logout-btn { background: none; border: 1px solid #3a4158; border-radius: 6px; padding: 4px 8px; color: #6b7280; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .local-selector { position: relative; display: flex; align-items: center; gap: 2px; background: #1e3a2f; border: 1px solid #00c89644; border-radius: 8px; padding: 4px 8px; cursor: pointer; font-size: 12px; color: #00c896; font-weight: 600; user-select: none; flex-shrink: 0; }
  .local-selector:hover { background: #1e4a3a; }
  .local-selector-label { white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis; }
  .local-dropdown { position: absolute; top: calc(100% + 4px); left: 0; min-width: 160px; background: #1e2438; border: 1px solid #2a3045; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.4); z-index: 200; overflow: hidden; }
  .local-option { padding: 10px 14px; font-size: 13px; color: #c9cdd6; cursor: pointer; transition: background .1s; }
  .local-option:hover { background: #252b3b; }
  .local-option.active { color: #00c896; background: #1e3a2f; font-weight: 700; }
  .local-badge { font-size: 11px; color: #60a5fa; background: #1e2a4a; border: 1px solid #3a5168; border-radius: 8px; padding: 3px 8px; white-space: nowrap; flex-shrink: 0; }
  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #141824; border-top: 1px solid #2a3045; z-index: 50; display: flex; justify-content: space-around; padding: 6px 0 10px; }
  .bn-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; color: #6b7280; font-size: 10px; cursor: pointer; padding: 4px 10px; font-family: 'Inter', sans-serif; }
  .bn-btn .bn-icon { font-size: 20px; }
  .bn-btn.active { color: #00c896; }
  .more-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 200; }
  .more-sheet { position: fixed; bottom: 0; left: 0; right: 0; background: #1a1f2e; border-radius: 20px 20px 0 0; padding: 16px 20px 32px; z-index: 201; animation: slideUp 0.22s ease-out; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .more-handle { width: 36px; height: 4px; background: #3a4158; border-radius: 2px; margin: 0 auto 18px; }
  .more-sheet-title { color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; text-align: center; margin-bottom: 16px; }
  .more-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .more-item { display: flex; flex-direction: column; align-items: center; gap: 6px; background: #252b3b; border: 1px solid #2a3348; border-radius: 14px; padding: 18px 8px 14px; color: #e8eaf0; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s; }
  .more-item:active, .more-item:hover { background: #2e3650; }
  .more-item .more-icon { font-size: 26px; line-height: 1; }
  /* ─── DocsView ─── */
  .docs-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .docs-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #2a3045; flex-shrink: 0; }
  .docs-list { flex: 1; overflow-y: auto; padding: 10px 16px; display: flex; flex-direction: column; gap: 8px; }
  .doc-card { display: flex; align-items: center; gap: 12px; background: #1e2438; border: 1px solid #2a3045; border-radius: 10px; padding: 10px 12px; cursor: default; }
  .doc-thumb { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; background: #252b3b; flex-shrink: 0; }
  .doc-thumb-pdf { width: 52px; height: 52px; border-radius: 8px; background: #252b3b; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .doc-info { flex: 1; min-width: 0; }
  .doc-type { font-size: 10px; font-weight: 700; color: #00c896; text-transform: uppercase; letter-spacing: 0.04em; }
  .doc-name { font-size: 13px; color: #e8eaf0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 1px 0; }
  .doc-date { font-size: 11px; color: #6b7280; }
  .docs-chat { display: flex; flex-direction: column; border-top: 2px solid #2a3045; flex-shrink: 0; max-height: 45%; }
  .docs-chat-header { padding: 7px 16px; background: #141824; flex-shrink: 0; }
  .docs-chat-msgs { flex: 1; overflow-y: auto; padding: 8px 16px; display: flex; flex-direction: column; gap: 6px; min-height: 80px; }
  .docs-chat-input-row { display: flex; gap: 8px; padding: 8px 16px 12px; border-top: 1px solid #2a3045; flex-shrink: 0; }
  .doc-msg-user { align-self: flex-end; background: #00c896; color: #0d1117; border-radius: 12px 12px 2px 12px; padding: 7px 11px; max-width: 85%; font-size: 13px; white-space: pre-wrap; }
  .doc-msg-ai { align-self: flex-start; background: #252b3b; color: #e8eaf0; border-radius: 2px 12px 12px 12px; padding: 7px 11px; max-width: 90%; font-size: 13px; white-space: pre-wrap; }
  /* multi-file upload grid */
  .docs-upload-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 8px; margin-bottom: 14px; max-height: 230px; overflow-y: auto; }
  .docs-upload-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #252b3b; border: 1px solid #2a3045; }
  .docs-upload-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .docs-upload-pdf-icon { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
  .docs-upload-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; border-radius: 8px; pointer-events: none; }
  .docs-upload-overlay.uploading { background: rgba(0,0,0,0.45); }
  .docs-upload-overlay.done { background: rgba(0,200,150,0.18); }
  .docs-upload-overlay.error { background: rgba(185,28,28,0.32); }
  .docs-upload-fname { font-size: 9px; color: #9ca3af; text-align: center; padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
  .docs-ok-banner { background: #0d2b1e; border: 1px solid #00c896; border-radius: 10px; padding: 10px 14px; color: #00c896; font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 10px; }
  .docs-err-banner { background: #2d1010; border: 1px solid #f87171; border-radius: 10px; padding: 10px 14px; color: #f87171; font-size: 12px; margin-bottom: 10px; }
  .doc-analysis-chip { display:inline-flex; align-items:center; gap:3px; background:#0d2b1e; border:1px solid #00c89644; border-radius:5px; padding:2px 7px; font-size:10px; color:#00c896; font-weight:600; white-space:nowrap; flex-shrink:0; }
  .doc-reanalyze-btn { background:none; border:none; color:#6b7280; font-size:13px; cursor:pointer; padding:3px 5px; border-radius:4px; font-family:inherit; line-height:1; flex-shrink:0; }
  .doc-reanalyze-btn:hover:not(:disabled) { color:#9ca3af; background:#252b3b; }
  .doc-reanalyze-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .upload-item-analysis { font-size:9px; text-align:center; padding:1px 2px; min-height:13px; color:#6b7280; line-height:1.3; }
  .upload-item-analysis.analyzing { color:#9ca3af; }
  .upload-item-analysis.done { color:#00c896; font-weight:600; }
  .upload-item-analysis.error { color:#f87171; }
  /* ─── Boleta analysis panel ─── */
  .boleta-modal { display: flex; flex-direction: column; max-height: 88vh; width: 100%; max-width: 480px; overflow: hidden; }
  .boleta-modal-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .boleta-modal-title { flex: 1; font-size: 14px; font-weight: 700; color: #e8eaf0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .boleta-status-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #141824; border-radius: 8px; margin-bottom: 12px; font-size: 12px; color: #9ca3af; }
  .boleta-items-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .boleta-items-table th { text-align: left; padding: 5px 6px; color: #6b7280; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #2a3045; }
  .boleta-items-table td { padding: 7px 6px; border-bottom: 1px solid #1e2438; vertical-align: top; }
  .boleta-item-row { animation: fadeSlideIn 0.25s ease both; }
  @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .boleta-item-name { color: #e8eaf0; font-weight: 500; }
  .boleta-item-barcode { font-family: monospace; color: #6b7280; font-size: 10px; }
  .boleta-item-price { color: #00c896; font-weight: 600; text-align: right; white-space: nowrap; }
  .boleta-item-qty { color: #9ca3af; text-align: center; }
  .boleta-total-row td { padding: 9px 6px; border-top: 2px solid #2a3045; font-weight: 700; color: #00c896; font-size: 13px; border-bottom: none; }
  .boleta-scroll { flex: 1; overflow-y: auto; min-height: 80px; }
  .boleta-empty { text-align: center; padding: 28px 0; color: #6b7280; font-size: 13px; }
  .boleta-analyze-btn { font-size: 11px; padding: 4px 9px; background: #1e3a2f; border: 1px solid #00c89666; border-radius: 6px; color: #00c896; cursor: pointer; font-family: inherit; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
  .boleta-analyze-btn:hover { background: #00c89622; }
  .boleta-analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { display: inline-block; animation: spin 0.8s linear infinite; }
  /* ─── Print modal ─── */
  .print-section { background: #1e2438; border: 1px solid #2a3045; border-radius: 10px; padding: 14px; margin-bottom: 10px; }
  .print-section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .print-section-icon { font-size: 22px; flex-shrink: 0; line-height: 1; }
  .print-section-title { font-size: 13px; font-weight: 600; color: #e8eaf0; line-height: 1.3; }
  .print-section-sub { font-size: 11px; color: #6b7280; }
  .print-ok { color: #00c896; font-size: 12px; margin-top: 6px; }
  .print-err { color: #f87171; font-size: 11px; margin-top: 6px; line-height: 1.5; }
  /* ─── Settings ─── */
  .settings-area { padding: 16px; overflow-y: auto; flex: 1; }
  .settings-section { background: #1e2438; border: 1px solid #2a3045; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .settings-section-title { font-size: 13px; font-weight: 700; color: #e8eaf0; margin-bottom: 14px; }
  /* ─── Location cards ─── */
  .location-card { background: #252b3b; border: 1px solid #2a3045; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
  .location-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .location-name-input { flex: 1; background: transparent; border: none; border-bottom: 1px solid #3a4158; color: #e8eaf0; font-size: 14px; font-weight: 600; padding: 2px 4px; outline: none; }
  .location-name-input:focus { border-bottom-color: #00c896; }
  .location-del-btn { background: none; border: none; color: #6b7280; font-size: 18px; cursor: pointer; padding: 0 2px; flex-shrink: 0; transition: color 0.15s; }
  .location-del-btn:hover { color: #f87171; }
  .location-add-form { background: #1a1f2e; border: 1px dashed #3a4158; border-radius: 10px; padding: 14px; margin-bottom: 8px; }
  .loc-select { width: 100%; background: #1a1f2e; border: 1px solid #3a4158; border-radius: 8px; color: #e8eaf0; padding: 8px 10px; font-size: 13px; cursor: pointer; margin-bottom: 6px; }
  .main { flex: 1; overflow: hidden; display: flex; flex-direction: column; padding-bottom: 60px; }
  .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
  @media (min-width: 700px) {
    .content.sale-content { flex-direction: row; }
    .cart { width: 300px !important; border-left: 1px solid #2a3045; border-top: none !important; max-height: unset !important; }
  }
  .products-area { flex: 1; overflow-y: auto; padding: 12px; }
  .search-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; }
  .search-box { flex: 1; position: relative; }
  .search-box input { width: 100%; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 8px 10px 8px 32px; color: #e8eaf0; font-size: 13px; outline: none; font-family: 'Inter', sans-serif; }
  .search-box input:focus { border-color: #00c896; }
  .search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #6b7280; font-size: 14px; }
  .scan-btn { display: flex; align-items: center; gap: 5px; padding: 8px 12px; background: #1e3a2f; border: 1px solid #00c896; border-radius: 8px; color: #00c896; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; }
  .categories { display: flex; gap: 6px; margin-bottom: 10px; overflow-x: auto; padding-bottom: 4px; }
  .categories::-webkit-scrollbar { height: 0; }
  .cat-btn { background: #252b3b; border: 1px solid #3a4158; border-radius: 16px; padding: 5px 12px; font-size: 12px; color: #9ca3af; cursor: pointer; white-space: nowrap; font-family: 'Inter', sans-serif; }
  .cat-btn.active { background: #1e3a2f; border-color: #00c896; color: #00c896; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .product-card { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 10px; cursor: pointer; transition: all .15s; }
  .product-card:hover { border-color: #00c896; }
  .product-card.low-stock { border-color: #ff6b6b33; }
  .product-card.no-stock-flash { border-color: #ff4444 !important; background: #3b1818 !important; animation: no-stock-pulse 0.35s ease 2; }
  @keyframes no-stock-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
  .no-stock-toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #b91c1c; color: #fff; border-radius: 14px; padding: 13px 22px; font-size: 14px; font-weight: 600; z-index: 9999; white-space: nowrap; box-shadow: 0 6px 28px rgba(0,0,0,0.55); display: flex; align-items: center; gap: 10px; animation: toast-in 0.2s ease; pointer-events: none; }
  .low-stock-toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #78350f; color: #fef3c7; border: 1px solid #d97706; border-radius: 14px; padding: 13px 22px; font-size: 14px; font-weight: 600; z-index: 9999; white-space: nowrap; box-shadow: 0 6px 28px rgba(0,0,0,0.55); display: flex; align-items: center; gap: 10px; animation: toast-in 0.2s ease; pointer-events: none; }
  @keyframes toast-in { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  .stock-toggle-row { display: flex; align-items: center; gap: 8px; padding: 4px 2px 6px; font-size: 12px; color: #9ca3af; user-select: none; }
  .toggle-switch { position: relative; width: 38px; height: 21px; flex-shrink: 0; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-slider { position: absolute; inset: 0; background: #3a4158; border-radius: 11px; cursor: pointer; transition: background 0.2s; }
  .toggle-slider::before { content: ""; position: absolute; width: 15px; height: 15px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
  .toggle-switch input:checked + .toggle-slider { background: #00c896; }
  .toggle-switch input:checked + .toggle-slider::before { transform: translateX(17px); }
  .prod-img { width: 100%; height: 65px; border-radius: 6px; margin-bottom: 6px; background: #1e2438; display: flex; align-items: center; justify-content: center; font-size: 26px; overflow: hidden; }
  .prod-img img { width: 100%; height: 65px; object-fit: cover; border-radius: 6px; }
  .product-name { font-size: 11px; font-weight: 600; margin-bottom: 2px; line-height: 1.3; }
  .product-cat { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
  .product-price { font-size: 13px; font-weight: 700; color: #00c896; font-family: monospace; }
  .product-stock { font-size: 10px; margin-top: 3px; }
  .stock-ok { color: #6b7280; }
  .stock-low { color: #ff6b6b; }
  .type-badge { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 4px; font-weight: 600; margin-bottom: 3px; }
  .type-unit { background: #1e3a5f; color: #60a5fa; }
  .type-kg { background: #3a2a1e; color: #fb923c; }
  .cart { background: #1e2438; border-top: 1px solid #2a3045; display: flex; flex-direction: column; max-height: 320px; }
  .cart-header { padding: 10px 14px; border-bottom: 1px solid #2a3045; display: flex; align-items: center; justify-content: space-between; }
  .cart-header h2 { font-size: 13px; font-weight: 600; }
  .badge { background: #00c896; color: #1a1f2e; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 99px; }
  .cart-items { flex: 1; overflow-y: auto; padding: 8px; }
  .cart-empty { text-align: center; color: #6b7280; padding: 16px; font-size: 12px; }
  .cart-item { background: #252b3b; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; border: 1px solid #3a4158; }
  .cart-item.highlight { border-color: #00c896; }
  .cart-item-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
  .cart-item-controls { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
  .qty-btn { width: 24px; height: 24px; border: 1px solid #3a4158; background: #1e2438; border-radius: 5px; cursor: pointer; color: #e8eaf0; font-size: 14px; display: flex; align-items: center; justify-content: center; }
  .qty-btn:hover { background: #00c896; border-color: #00c896; color: #1a1f2e; }
  .qty-input { width: 52px; background: #1e2438; border: 1px solid #3a4158; border-radius: 5px; padding: 2px 4px; color: #e8eaf0; font-size: 12px; text-align: center; font-family: monospace; outline: none; }
  .item-subtotal { margin-left: auto; font-size: 12px; font-weight: 600; color: #00c896; font-family: monospace; }
  .del-btn { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 13px; }
  .del-btn:hover { color: #ff6b6b; }
  .cart-footer { padding: 10px 14px; border-top: 1px solid #2a3045; }
  .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
  .total-label { color: #9ca3af; }
  .grand-total { font-size: 17px; font-weight: 700; color: #00c896; font-family: monospace; }
  .pay-btn { width: 100%; padding: 10px; background: linear-gradient(135deg, #00c896, #00a87a); border: none; border-radius: 8px; color: #1a1f2e; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 8px; font-family: 'Inter', sans-serif; }
  .pay-btn:disabled { opacity: .4; cursor: not-allowed; }
  .clear-btn { width: 100%; padding: 6px; background: transparent; border: 1px solid #3a4158; border-radius: 6px; color: #6b7280; font-size: 12px; cursor: pointer; margin-top: 4px; font-family: 'Inter', sans-serif; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); display: flex; align-items: flex-end; justify-content: center; z-index: 200; }
  .modal { background: #1e2438; border: 1px solid #3a4158; border-radius: 20px 20px 0 0; padding: 22px 18px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
  .modal h2 { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
  .modal-section { margin-bottom: 12px; }
  .modal-label { font-size: 11px; color: #9ca3af; margin-bottom: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: .4px; }
  .modal-input { width: 100%; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 9px 11px; color: #e8eaf0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; }
  .modal-input:focus { border-color: #00c896; }
  .pay-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .pay-method { padding: 9px; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; cursor: pointer; text-align: center; font-size: 12px; font-weight: 500; font-family: 'Inter', sans-serif; color: #e8eaf0; }
  .pay-method.selected { background: #1e3a2f; border-color: #00c896; color: #00c896; }
  .change-box { background: #252b3b; border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
  .change-amount { font-size: 18px; font-weight: 700; font-family: monospace; }
  .change-ok { color: #00c896; }
  .change-short { color: #ff6b6b; }
  .modal-actions { display: flex; gap: 8px; margin-top: 14px; }
  .btn-primary { flex: 1; padding: 11px; background: linear-gradient(135deg, #00c896, #00a87a); border: none; border-radius: 8px; color: #1a1f2e; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-secondary { padding: 11px 14px; background: transparent; border: 1px solid #3a4158; border-radius: 8px; color: #9ca3af; font-size: 14px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .img-upload { width: 100%; height: 80px; background: #252b3b; border: 2px dashed #3a4158; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; gap: 4px; }
  .img-upload span { font-size: 11px; color: #6b7280; }
  .img-preview { width: 100%; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; }
  .scanner-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.85); display: flex; align-items: flex-end; justify-content: center; z-index: 300; }
  .scanner-box { background: #1e2438; border-radius: 20px 20px 0 0; padding: 18px; width: 100%; max-width: 420px; }
  .scanner-box h2 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .scanner-box p { font-size: 12px; color: #9ca3af; margin-bottom: 10px; }
  #scanner-viewport { width: 100%; border-radius: 10px; overflow: hidden; background: #000; min-height: 180px; }
  #scanner-viewport video { width: 100%; border-radius: 10px; display: block; }
  .scan-status { margin-top: 8px; text-align: center; font-size: 12px; color: #9ca3af; min-height: 18px; }
  .scan-status.found { color: #00c896; font-weight: 600; }
  .scan-status.notfound { color: #ff6b6b; }
  .scan-manual input { width: 100%; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 9px 11px; color: #e8eaf0; font-size: 14px; outline: none; font-family: monospace; margin-top: 8px; }
  /* Barcode row in ProductModal */
  .barcode-row { display: flex; gap: 6px; align-items: center; }
  .barcode-row .modal-input { flex: 1; min-width: 0; }
  .barcode-cam-btn { flex-shrink: 0; padding: 9px 12px; background: #1e3a2f; border: 1px solid #00c896; border-radius: 8px; color: #00c896; font-size: 18px; cursor: pointer; line-height: 1; transition: all .15s; }
  .barcode-cam-btn:hover { background: #00c896; color: #1a1f2e; }
  .barcode-scanned { border-color: #00c896 !important; box-shadow: 0 0 0 2px rgba(0,200,150,.25) !important; }
  .barcode-hint { font-size: 10px; color: #6b7280; margin-top: 4px; }
  /* ─── AI Chat ─── */
  .ai-fab { position: fixed; bottom: 72px; right: 16px; width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #00c896, #00a87a); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; z-index: 400; box-shadow: 0 4px 20px rgba(0,200,150,.4); transition: transform .15s; }
  .ai-fab:hover { transform: scale(1.08); }
  .ai-fab .ai-fab-badge { position: absolute; top: -2px; right: -2px; width: 16px; height: 16px; background: #ef4444; border-radius: 50%; border: 2px solid #1a1f2e; animation: pulse-badge 2s infinite; }
  @keyframes pulse-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
  .ai-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #1a1f2e; }
  .ai-panel-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #141824; border-bottom: 1px solid #2a3045; flex-shrink: 0; }
  .ai-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg,#00c896,#00a87a); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .ai-panel-title { flex: 1; }
  .ai-panel-title h3 { font-size: 14px; font-weight: 700; color: #e8eaf0; margin: 0; }
  .ai-panel-title p { font-size: 11px; color: #6b7280; margin: 0; }
  .ai-close-btn { background: none; border: none; color: #6b7280; font-size: 22px; cursor: pointer; padding: 4px; }
  .ai-clear-btn { background: none; border: 1px solid #3a4158; border-radius: 6px; color: #6b7280; font-size: 11px; cursor: pointer; padding: 4px 8px; }
  .ai-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .ai-msg { display: flex; gap: 8px; max-width: 90%; }
  .ai-msg.user { flex-direction: row-reverse; align-self: flex-end; }
  .ai-msg.assistant { align-self: flex-start; }
  .ai-msg-bubble { padding: 10px 13px; border-radius: 16px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .ai-msg.user .ai-msg-bubble { background: #1e3a2f; border: 1px solid #00c896; color: #e8eaf0; border-bottom-right-radius: 4px; }
  .ai-msg.assistant .ai-msg-bubble { background: #252b3b; border: 1px solid #3a4158; color: #e8eaf0; border-bottom-left-radius: 4px; }
  .ai-msg-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; }
  .ai-msg.user .ai-msg-avatar { background: #2a3045; }
  .ai-msg.assistant .ai-msg-avatar { background: linear-gradient(135deg,#00c896,#00a87a); }
  .ai-typing { display: flex; gap: 4px; align-items: center; padding: 10px 13px; }
  .ai-typing span { width: 7px; height: 7px; background: #6b7280; border-radius: 50%; animation: ai-dot 1.4s infinite; }
  .ai-typing span:nth-child(2) { animation-delay: .2s; }
  .ai-typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes ai-dot { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
  .ai-suggestions { display: flex; gap: 6px; overflow-x: auto; padding: 8px 16px 4px; flex-shrink: 0; }
  .ai-suggestions::-webkit-scrollbar { height: 0; }
  .ai-suggestion { background: #252b3b; border: 1px solid #3a4158; border-radius: 16px; padding: 6px 12px; font-size: 11px; color: #9ca3af; cursor: pointer; white-space: nowrap; font-family: 'Inter', sans-serif; }
  .ai-suggestion:hover { border-color: #00c896; color: #00c896; }
  .ai-input-row { display: flex; gap: 8px; padding: 12px 16px; background: #141824; border-top: 1px solid #2a3045; flex-shrink: 0; }
  .ai-input { flex: 1; background: #252b3b; border: 1px solid #3a4158; border-radius: 20px; padding: 10px 14px; color: #e8eaf0; font-size: 13px; outline: none; font-family: 'Inter', sans-serif; resize: none; max-height: 100px; line-height: 1.4; }
  .ai-input:focus { border-color: #00c896; }
  .ai-send-btn { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#00c896,#00a87a); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; align-self: flex-end; }
  .ai-send-btn:disabled { opacity: .4; cursor: not-allowed; }
  .ai-welcome { text-align: center; padding: 30px 20px; color: #6b7280; }
  .ai-welcome .ai-welcome-icon { font-size: 48px; margin-bottom: 12px; }
  .ai-welcome h3 { font-size: 16px; font-weight: 700; color: #e8eaf0; margin-bottom: 6px; }
  .ai-welcome p { font-size: 12px; line-height: 1.6; }
  /* Quagga scanner viewport */
  .camera-video { width: 100%; border-radius: 10px; display: block; background: #000; min-height: 200px; }
  .quagga-aim { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 10; }
  .quagga-aim-line { width: 70%; height: 2px; background: rgba(0,200,150,.8); box-shadow: 0 0 10px rgba(0,200,150,.7); animation: scan-line 2s ease-in-out infinite; }
  @keyframes scan-line { 0%,100%{transform:translateY(-35px)} 50%{transform:translateY(35px)} }
  .success-icon { font-size: 44px; text-align: center; margin-bottom: 10px; }
  .success-details { background: #252b3b; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; }
  .success-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
  .success-row:last-child { font-weight: 700; color: #00c896; margin-bottom: 0; }
  .inv-area { flex: 1; overflow-y: auto; padding: 12px; }
  .inv-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .inv-table th { text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #2a3045; }
  .inv-table td { padding: 8px 10px; border-bottom: 1px solid #2a3045; }
  .inv-table tr:hover td { background: #252b3b; }
  .btn-add { background: linear-gradient(135deg, #00c896, #00a87a); border: none; border-radius: 8px; padding: 8px 14px; color: #1a1f2e; font-weight: 700; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-edit { background: #252b3b; border: 1px solid #3a4158; border-radius: 5px; padding: 4px 8px; color: #9ca3af; font-size: 11px; cursor: pointer; margin-right: 3px; font-family: 'Inter', sans-serif; }
  .btn-del { background: transparent; border: none; padding: 4px 8px; color: #6b7280; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .select-input { background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 9px 11px; color: #e8eaf0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; width: 100%; }
  .hist-area { flex: 1; overflow-y: auto; padding: 12px; }
  .hist-item { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
  .hist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
  .hist-id { font-size: 10px; color: #6b7280; font-family: monospace; }
  .hist-total { font-size: 14px; font-weight: 700; color: #00c896; font-family: monospace; }
  .hist-meta { font-size: 11px; color: #9ca3af; margin-bottom: 5px; }
  .hist-products { font-size: 11px; color: #9ca3af; }
  .rep-area { flex: 1; overflow-y: auto; padding: 12px; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .stat-card { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 12px; }
  .stat-label { font-size: 10px; color: #6b7280; margin-bottom: 5px; text-transform: uppercase; }
  .stat-value { font-size: 18px; font-weight: 700; font-family: monospace; }
  .stat-green { color: #00c896; }
  .stat-blue { color: #60a5fa; }
  .stat-orange { color: #fb923c; }
  .rep-section { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
  .rep-section h3 { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
  .rep-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #2a3045; font-size: 12px; }
  .rep-row:last-child { border-bottom: none; }
  .bar { height: 5px; background: #3a4158; border-radius: 3px; margin-top: 3px; }
  .bar-fill { height: 5px; background: linear-gradient(90deg, #00c896, #00a87a); border-radius: 3px; }
  /* Bluetooth / Print */
  .print-btn { width:100%; padding:11px 14px; background:#252b3b; border:1.5px solid #3a4158; border-radius:8px; color:#e8eaf0; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter',sans-serif; transition:background 0.15s,border-color 0.15s; }
  .print-btn:hover:not(:disabled) { background:#2d3548; border-color:#60a5fa; }
  .print-btn:disabled { opacity:0.55; cursor:default; }
  .print-btn.bt-connected { border-color:#00c896; color:#00c896; }
  .bt-error { margin-top:6px; padding:8px 10px; background:#2d1515; border:1px solid #7f1d1d; border-radius:8px; color:#fca5a5; font-size:11px; line-height:1.5; }
  .print-section { background:#1e2438; border:1px solid #3a4158; border-radius:10px; padding:12px; margin-bottom:10px; }
  .print-section h3 { font-size:12px; font-weight:600; margin-bottom:10px; color:#9ca3af; }
  /* ─── Reportes e Inteligencia ─── */
  .ri-wrap { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .ri-tabs { display:flex; overflow-x:auto; background:#141824; border-bottom:1px solid #2a3045; flex-shrink:0; }
  .ri-tabs::-webkit-scrollbar { height:0; }
  .ri-tab { flex-shrink:0; padding:10px 14px; font-size:11px; font-weight:600; color:#6b7280; border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; font-family:'Inter',sans-serif; white-space:nowrap; }
  .ri-tab.active { color:#00c896; border-bottom-color:#00c896; }
  .ri-filter-bar { display:flex; gap:6px; overflow-x:auto; padding:10px 12px; flex-shrink:0; border-bottom:1px solid #2a3045; background:#1a1f2e; }
  .ri-filter-bar::-webkit-scrollbar { height:0; }
  .ri-fbtn { padding:5px 12px; border-radius:14px; border:1px solid #3a4158; background:none; color:#9ca3af; font-size:11px; font-weight:600; cursor:pointer; white-space:nowrap; font-family:'Inter',sans-serif; }
  .ri-fbtn.active { background:#1e3a2f; border-color:#00c896; color:#00c896; }
  .ri-fbtn-custom { padding:5px 8px; }
  .ri-custom-dates { display:flex; gap:6px; align-items:center; padding:0 12px 8px; flex-shrink:0; }
  .ri-custom-dates input { background:#252b3b; border:1px solid #3a4158; border-radius:8px; padding:5px 8px; color:#e8eaf0; font-size:12px; outline:none; font-family:'Inter',sans-serif; }
  .ri-custom-dates input:focus { border-color:#00c896; }
  .ri-scroll { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:12px; }
  .ri-kpi-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .ri-kpi { background:#252b3b; border:1px solid #3a4158; border-radius:12px; padding:12px; }
  .ri-kpi-label { font-size:10px; color:#6b7280; font-weight:500; text-transform:uppercase; letter-spacing:.4px; margin-bottom:4px; }
  .ri-kpi-value { font-size:18px; font-weight:700; font-family:monospace; }
  .ri-kpi-delta { font-size:10px; margin-top:3px; }
  .ri-kpi-delta.up { color:#00c896; }
  .ri-kpi-delta.down { color:#ff6b6b; }
  .ri-kpi-delta.flat { color:#6b7280; }
  .ri-card { background:#252b3b; border:1px solid #3a4158; border-radius:12px; padding:12px; }
  .ri-card h3 { font-size:12px; font-weight:700; margin-bottom:10px; color:#e8eaf0; }
  .ri-chart-wrap { width:100%; margin-top:4px; }
  .ri-list { display:flex; flex-direction:column; gap:6px; }
  .ri-item { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid #2a3045; }
  .ri-item:last-child { border-bottom:none; }
  .ri-item-rank { width:20px; font-size:11px; font-weight:700; color:#6b7280; text-align:center; flex-shrink:0; }
  .ri-item-name { flex:1; font-size:12px; font-weight:500; color:#e8eaf0; }
  .ri-item-val { font-size:12px; font-weight:700; font-family:monospace; color:#00c896; }
  .ri-item-sub { font-size:10px; color:#6b7280; }
  .ri-item-bar { height:4px; background:#3a4158; border-radius:2px; margin-top:2px; }
  .ri-item-bar-fill { height:4px; background:linear-gradient(90deg,#00c896,#00a87a); border-radius:2px; }
  .ri-badge { display:inline-flex; align-items:center; gap:4px; background:#1e3a2f; border:1px solid #00c89644; border-radius:8px; padding:4px 8px; font-size:11px; color:#00c896; font-weight:600; }
  .ri-badge.warn { background:#3a2a1e; border-color:#fb923c44; color:#fb923c; }
  .ri-badge.danger { background:#3b1818; border-color:#ff6b6b44; color:#ff6b6b; }
  .ri-star-card { background:linear-gradient(135deg,#1e3a2f,#1a2f25); border:1px solid #00c89655; border-radius:12px; padding:12px; }
  .ri-star-card h3 { font-size:11px; color:#00c896; font-weight:600; margin-bottom:6px; text-transform:uppercase; letter-spacing:.4px; }
  .ri-star-name { font-size:15px; font-weight:700; color:#e8eaf0; margin-bottom:2px; }
  .ri-star-val { font-size:12px; font-family:monospace; color:#00c896; }
  .ri-empty { color:#6b7280; font-size:12px; text-align:center; padding:16px 0; }
  .ri-methods-row { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #2a3045; }
  .ri-methods-row:last-child { border-bottom:none; }
  .ri-methods-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .ri-methods-name { flex:1; font-size:12px; color:#e8eaf0; }
  .ri-methods-pct { font-size:11px; color:#6b7280; }
  .ri-methods-val { font-size:12px; font-weight:700; font-family:monospace; color:#00c896; }
  /* Login */
  .login-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: #1a1f2e; }
  .login-box { background: #1e2438; border: 1px solid #3a4158; border-radius: 20px; padding: 28px 24px; width: 100%; max-width: 380px; }
  .login-box h1 { font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 4px; }
  .login-box p { font-size: 13px; color: #9ca3af; text-align: center; margin-bottom: 24px; }
  .login-tabs { display: flex; gap: 4px; background: #252b3b; border-radius: 10px; padding: 4px; margin-bottom: 20px; }
  .login-tab { flex: 1; padding: 8px; border: none; border-radius: 7px; background: transparent; color: #9ca3af; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; }
  .login-tab.active { background: #1e2438; color: #00c896; }
  .login-field { margin-bottom: 12px; }
  .login-field label { display: block; font-size: 12px; color: #9ca3af; margin-bottom: 5px; }
  .login-input { width: 100%; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 10px 12px; color: #e8eaf0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; }
  .login-input:focus { border-color: #00c896; }
  .login-btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #00c896, #00a87a); border: none; border-radius: 10px; color: #1a1f2e; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; font-family: 'Inter', sans-serif; }
  .login-error { background: #ff6b6b22; border: 1px solid #ff6b6b44; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #ff6b6b; margin-top: 10px; }
  /* Permisos */
  .perm-area { flex: 1; overflow-y: auto; padding: 12px; }
  .perm-card { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 14px; margin-bottom: 10px; }
  .perm-email { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
  .perm-toggle { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #2a3045; font-size: 12px; }
  .perm-toggle:last-child { border-bottom: none; }
  .toggle-switch { width: 36px; height: 20px; background: #3a4158; border-radius: 10px; position: relative; cursor: pointer; transition: background .2s; }
  .toggle-switch.on { background: #00c896; }
  .toggle-knob { width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: left .2s; }
  .toggle-switch.on .toggle-knob { left: 18px; }
  .sync-indicator { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #00c896; }
  .sync-dot { width: 6px; height: 6px; background: #00c896; border-radius: 50%; animation: blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
`;

// ─── Auth ─────────────────────────────────────────────────────────────────────
function LoginScreen({ firebaseError }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const friendlyError = (e) => {
    const msg = e.message || "";
    if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) return "Email o contraseña incorrectos";
    if (msg.includes("email-already-in-use")) return "Este email ya está registrado";
    if (msg.includes("weak-password")) return "La contraseña debe tener al menos 6 caracteres";
    if (msg.includes("operation-not-allowed") || e.code === "auth/operation-not-allowed") return "Email/Password no está habilitado en Firebase. Activalo en: Firebase Console → Authentication → Sign-in method → Email/Password.";
    if (msg.includes("network-request-failed")) return "Sin conexión a internet. Verificá tu red.";
    return msg;
  };

  const handleSubmit = async () => {
    if (!email || !pass) { setError("Completá email y contraseña"); return; }
    setError(""); setLoading(true);
    try {
      if (tab === "login") {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        if (!name.trim()) { setError("Ingresá tu nombre"); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), {
          email, name, role: "collaborator", uid: cred.user.uid,
          permissions: { sell: true, viewInventory: true, editInventory: false, viewReports: false },
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      setError(friendlyError(e));
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>🛒</div>
        <h1>Mi POS 2</h1>
        <p>Sistema de punto de venta</p>
        {firebaseError && (
          <div className="login-error" style={{ marginBottom: 16 }}>
            ⚠️ {firebaseError}
          </div>
        )}
        <div className="login-tabs">
          <button className={`login-tab${tab === "login" ? " active" : ""}`} onClick={() => setTab("login")}>Iniciar sesión</button>
          <button className={`login-tab${tab === "register" ? " active" : ""}`} onClick={() => setTab("register")}>Registrarse</button>
        </div>
        {tab === "register" && (
          <div className="login-field">
            <label>Nombre</label>
            <input className="login-input" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
          </div>
        )}
        <div className="login-field">
          <label>Email</label>
          <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" />
        </div>
        <div className="login-field">
          <label>Contraseña</label>
          <input className="login-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••" autoComplete="current-password" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        <button className="login-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Cargando..." : tab === "login" ? "Entrar" : "Crear cuenta"}
        </button>
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}

// ─── Scanner ──────────────────────────────────────────────────────────────────
function ScannerModal({ products, onFound, onNotFound, onClose }) {
  const [status, setStatus]     = useState("Iniciando cámara...");
  const [statusType, setStatusType] = useState("");
  const [manualCode, setManualCode] = useState("");
  const html5QrRef    = useRef(null);
  const startedRef    = useRef(false);
  // aliveRef gates the one-time dispatch — prevents duplicate calls at 10fps.
  const aliveRef      = useRef(true);
  // Keep latest props in refs so callbacks never see stale closures.
  const productsRef   = useRef(products);
  const onFoundRef    = useRef(onFound);
  const onNotFoundRef = useRef(onNotFound);
  useEffect(() => { productsRef.current   = products;   }, [products]);
  useEffect(() => { onFoundRef.current    = onFound;    }, [onFound]);
  useEffect(() => { onNotFoundRef.current = onNotFound; }, [onNotFound]);

  // handleCode is stable (no deps) — all dynamic data accessed via refs.
  const handleCode = (code) => {
    if (!code) return;
    const found = productsRef.current.find(p => p.barcode === code);
    if (found) {
      if (!aliveRef.current) return; // already dispatched — ignore duplicates
      aliveRef.current   = false;    // lock: only one dispatch ever
      startedRef.current = false;
      setStatus(`✓ ${found.name}`);
      setStatusType("found");
      if (html5QrRef.current) html5QrRef.current.stop().catch(() => {});
      // Short delay so user sees the confirmation before the modal closes
      setTimeout(() => onFoundRef.current(found), 500);
    } else {
      if (!aliveRef.current) return;
      aliveRef.current   = false;
      startedRef.current = false;
      setStatus("⏳ Buscando en base de datos...");
      setStatusType("notfound");
      if (html5QrRef.current) html5QrRef.current.stop().catch(() => {});
      // Brief pause so the user sees feedback before the modal changes
      setTimeout(() => onNotFoundRef.current?.(code), 350);
    }
  };

  useEffect(() => {
    aliveRef.current   = true;
    startedRef.current = false;

    const init = async () => {
      // Use the bundled npm package — no CDN script injection, no timing races
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!aliveRef.current) return;

      // div#scanner-viewport is always in DOM (not conditional) — safe to init here
      const scanner = new Html5Qrcode("scanner-viewport", { verbose: false });
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (code) => handleCode(code),
        () => {} // per-frame decode error — expected for non-barcode frames
      );

      startedRef.current = true;
      if (!aliveRef.current) {
        // Unmounted while start() was in flight — stop immediately
        scanner.stop().catch(() => {});
        return;
      }
      setStatus("Apuntá el código de barras a la cámara");
    };

    init().catch((err) => {
      if (!aliveRef.current) return;
      const m = err?.message || String(err);
      if (/NotAllowed|PermissionDenied/i.test(m)) {
        setStatus("Permiso de cámara denegado. Usá el ingreso manual.");
      } else if (/NotFound|DevicesNotFound|no camera/i.test(m)) {
        setStatus("No se encontró cámara en este dispositivo.");
      } else if (/NotReadable|TrackStart/i.test(m)) {
        setStatus("Cámara en uso por otra app. Cerrá otras apps y volvé a intentar.");
      } else {
        setStatus(`Cámara no disponible: ${m}`);
      }
      setStatusType("notfound");
    });

    return () => {
      aliveRef.current = false;
      if (html5QrRef.current && startedRef.current) {
        startedRef.current = false;
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div className="scanner-box" onClick={e => e.stopPropagation()}>
        <h2>📷 Escanear código</h2>
        <p>Cámara o ingreso manual</p>
        {/* div must always be in DOM — html5-qrcode accesses it by ID on init */}
        <div id="scanner-viewport" />
        <div className={`scan-status ${statusType}`}>{status}</div>
        <div className="scan-manual">
          <input value={manualCode} onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCode(manualCode.trim())}
            placeholder="Código de barras o Enter para buscar..." autoFocus />
        </div>
        <div className="modal-actions" style={{ marginTop: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleCode(manualCode.trim())}>Buscar</button>
        </div>
      </div>
    </div>
  );
}

// ─── OffModal — Open Food Facts lookup result ──────────────────────────────────
function OffModal({ barcode, offName, offBrand, offImg, found, categories, onClose }) {
  const [name, setName]         = useState(offName || "");
  const [cat, setCat]           = useState(categories?.[0] ?? "General");
  const [price, setPrice]       = useState("");
  const [stock, setStock]       = useState("0");
  const [minStock, setMinStock] = useState("5");
  const [img, setImg]           = useState(offImg || "");  // URL of product image
  const [imgOk, setImgOk]       = useState(!!offImg);     // true once <img> loads without error
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);
  const kbRef                   = useRef(null); // forces virtual keyboard on Android HID

  const valid = name.trim().length > 0 && parseFloat(price) > 0;

  const localId = useContext(LocalCtx);
  const handleAdd = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "locals", localId, "products"), {
        barcode:  barcode || null,
        name:     name.trim(),
        category: cat || "General",
        price:    parseFloat(price),
        stock:    parseFloat(stock) || 0,
        minStock: parseFloat(minStock) || 5,
        type:     "unit",
        unit:     "u",
        img:      (img.trim() && imgOk) ? img.trim() : null,
      });
      setDone(true);
      setTimeout(onClose, 1300);
    } catch (err) {
      setSaving(false);
      alert("Error al guardar: " + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Off-screen input — focus() summons the virtual keyboard when HID scanner suppresses it */}
      <input ref={kbRef} readOnly aria-hidden="true"
        style={{ position: "fixed", top: -999, left: -999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 44 }}>✅</div>
            <div style={{ color: "#00c896", fontWeight: 600, marginTop: 10 }}>Producto agregado al inventario</div>
          </div>
        ) : (
          <>
            {/* Header row: title + ⌨️ button */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 style={{ margin: 0 }}>
                {found ? "🌐 Encontrado en Open Food Facts" : "❓ Código no encontrado"}
              </h2>
              <button onClick={() => kbRef.current?.focus()} title="Mostrar teclado"
                style={{ background: "#252b3b", border: "1px solid #3a4158", borderRadius: 6,
                  color: "#9ca3af", fontSize: 15, padding: "4px 8px", cursor: "pointer",
                  lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>⌨️</button>
            </div>

            {found && offBrand
              ? <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 10 }}>{offBrand}</div>
              : !found && (
                  <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 10 }}>
                    No encontrado en Open Food Facts. Completá los datos para cargarlo manualmente.
                  </div>
                )
            }

            {/* Image — auto-filled from OFF when found, or paste URL manually */}
            <div className="modal-section" style={{ marginBottom: 10 }}>
              <div className="modal-label">Imagen</div>
              {imgOk && img && (
                <img src={img} alt="" onError={() => setImgOk(false)}
                  style={{ width: "100%", maxHeight: 140, objectFit: "contain",
                    borderRadius: 8, background: "#fff", marginBottom: 6 }} />
              )}
              <input className="modal-input" value={img} placeholder="https://... (pegá URL de imagen)"
                onChange={e => { setImg(e.target.value); setImgOk(true); }}
                style={{ fontSize: 11, color: "#9ca3af" }} />
            </div>

            {/* Barcode — read-only so the user siempre ve qué código se escaneó */}
            <div className="modal-section" style={{ marginBottom: 10 }}>
              <div className="modal-label">Código de barras</div>
              <input className="modal-input" value={barcode || ""} readOnly
                style={{ fontFamily: "monospace", color: "#6b7280", cursor: "default" }} />
            </div>

            <div className="modal-section">
              <div className="modal-label">Nombre</div>
              <input className="modal-input" value={name} onChange={e => setName(e.target.value)}
                placeholder="Nombre del producto" autoFocus />
            </div>
            <div className="modal-section">
              <div className="modal-label">Categoría</div>
              <select className="modal-input" value={cat} onChange={e => setCat(e.target.value)}>
                {(categories?.length ? categories : ["General"]).map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div className="modal-section" style={{ flex: 1 }}>
                <div className="modal-label">Precio ($)</div>
                <input className="modal-input" type="number" min="0" step="0.01"
                  placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)}
                  style={{ fontFamily: "monospace" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div className="modal-section" style={{ flex: 1 }}>
                <div className="modal-label">Stock actual</div>
                <input className="modal-input" type="number" min="0" step="1"
                  placeholder="0" value={stock} onChange={e => setStock(e.target.value)}
                  style={{ fontFamily: "monospace" }} />
              </div>
              <div className="modal-section" style={{ flex: 1 }}>
                <div className="modal-label">Stock mínimo</div>
                <input className="modal-input" type="number" min="0" step="1"
                  placeholder="5" value={minStock} onChange={e => setMinStock(e.target.value)}
                  style={{ fontFamily: "monospace" }} />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 8 }}>
              <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn-primary" onClick={handleAdd} disabled={!valid || saving}
                style={{ flex: 2, opacity: (!valid || saving) ? 0.6 : 1 }}>
                {saving ? "Guardando..." : "Agregar al inventario"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── KgModal ──────────────────────────────────────────────────────────────────
function KgModal({ product, onConfirm, onClose }) {
  const [kg, setKg] = useState("");
  const total = (parseFloat(kg) || 0) * (product?.price || 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚖️ Venta por peso</h2>
        <div style={{ background: "#252b3b", borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{product?.name}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{fmt(product?.price)} / kg</div>
        </div>
        <div className="modal-section">
          <div className="modal-label">Kilos</div>
          <input className="modal-input" type="number" step="0.01" min="0.01" placeholder="Ej: 1.5" value={kg} onChange={e => setKg(e.target.value)} autoFocus style={{ fontFamily: "monospace", fontSize: 18 }} />
        </div>
        {parseFloat(kg) > 0 && <div className="change-box" style={{ marginBottom: 8 }}><span style={{ color: "#9ca3af", fontSize: 12 }}>Subtotal</span><span className="change-amount change-ok">{fmt(total)}</span></div>}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => { if (parseFloat(kg) > 0) onConfirm(parseFloat(kg)); }} disabled={!(parseFloat(kg) > 0)}>Agregar</button>
        </div>
      </div>
    </div>
  );
}

// ─── PayModal ─────────────────────────────────────────────────────────────────
function PayModal({ total, onConfirm, onClose }) {
  const [method, setMethod] = useState("Efectivo");
  const [received, setReceived] = useState("");
  const change = method === "Efectivo" ? (parseFloat(received) || 0) - total : 0;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>💳 Cobrar</h2>
        <div className="modal-section">
          <div className="modal-label">Total</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#00c896", fontFamily: "monospace" }}>{fmt(total)}</div>
        </div>
        <div className="modal-section">
          <div className="modal-label">Método de pago</div>
          <div className="pay-methods">
            {["Efectivo", "Débito", "Crédito", "Transferencia"].map(m =>
              <button key={m} className={`pay-method${method === m ? " selected" : ""}`} onClick={() => setMethod(m)}>{m}</button>)}
          </div>
        </div>
        {method === "Efectivo" && (
          <div className="modal-section">
            <div className="modal-label">Efectivo recibido</div>
            <input className="modal-input" type="number" placeholder="0.00" value={received} onChange={e => setReceived(e.target.value)} autoFocus style={{ fontFamily: "monospace", fontSize: 16 }} />
            {parseFloat(received) > 0 && <div className="change-box" style={{ marginTop: 8 }}><span style={{ fontSize: 12, color: "#9ca3af" }}>{change >= 0 ? "Vuelto" : "Falta"}</span><span className={`change-amount ${change >= 0 ? "change-ok" : "change-short"}`}>{fmt(Math.abs(change))}</span></div>}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onConfirm(method, parseFloat(received) || total, change)} disabled={method === "Efectivo" && change < 0 && received !== ""}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─── CameraScanner ────────────────────────────────────────────────────────────
// Uses html5-qrcode (npm package, bundled) for live camera barcode scanning.
// Sequence: render div → useEffect (DOM ready) → import lib → init scanner.
// The reader div is ALWAYS in the DOM (never conditional) so html5-qrcode can
// find it by ID the moment the useEffect fires.
function CameraScanner({ onCode, onClose }) {
  const [msg, setMsg]   = useState("Iniciando cámara…");
  const [error, setError] = useState("");
  const [found, setFound] = useState("");
  const scannerRef  = useRef(null);
  const startedRef  = useRef(false);
  const aliveRef    = useRef(true);
  // Static ID — must match the div below. Never change between renders.
  const READER_ID = "h5qr-mi-pos-reader";

  useEffect(() => {
    aliveRef.current  = true;
    startedRef.current = false;

    const init = async () => {
      // Dynamic import: not part of the main bundle, won't crash app on load
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!aliveRef.current) return;

      // By this point React has committed the render — the div is in the DOM.
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;

      const recent = [];

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.333 },
        (decodedText) => {
          if (!aliveRef.current || !decodedText) return;
          recent.push(decodedText);
          // Two consecutive identical reads = confirmed code
          if (recent.length >= 2 && recent.at(-1) === recent.at(-2)) {
            aliveRef.current = false;
            startedRef.current = false;
            setFound(decodedText);
            setMsg(`✓ ${decodedText}`);
            scanner.stop().catch(() => {});
            setTimeout(() => onCode(decodedText), 400);
          }
        },
        () => {} // per-frame decode error — expected, ignore
      );

      // .start() resolved = camera is live
      startedRef.current = true;
      if (!aliveRef.current) {
        // Component unmounted while start() was pending — clean up immediately
        scanner.stop().catch(() => {});
        return;
      }
      setMsg("Apuntá el código de barras a la cámara");
    };

    init().catch((err) => {
      if (!aliveRef.current) return;
      // Attempt cleanup in case scanner started partially
      if (scannerRef.current && startedRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      const m = err?.message || String(err);
      if (/NotAllowed|PermissionDenied/i.test(m)) {
        setError("Permiso de cámara denegado.\nHabilitá la cámara en la configuración del navegador y volvé a intentar.");
      } else if (/NotFound|DevicesNotFound|no camera/i.test(m)) {
        setError("No se encontró ninguna cámara en este dispositivo.");
      } else if (/NotReadable|TrackStart/i.test(m)) {
        setError("La cámara está siendo usada por otra aplicación. Cerrá otras apps y volvé a intentar.");
      } else {
        setError(`Error al iniciar la cámara: ${m}`);
      }
    });

    return () => {
      aliveRef.current = false;
      if (scannerRef.current && startedRef.current) {
        startedRef.current = false;
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div className="scanner-box" onClick={e => e.stopPropagation()}>
        <h2>📷 Escanear código</h2>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
          EAN-13 · EAN-8 · Code-128 · UPC · QR
        </p>

        {/*
          CRITICAL: this div must always be rendered — never inside an {error && ...}
          or {!error && ...} conditional. html5-qrcode looks it up by ID in useEffect
          (after React commits the DOM). If the div is missing, the constructor throws
          and the whole component crashes.
        */}
        <div
          id={READER_ID}
          style={{
            width: "100%",
            borderRadius: 10,
            overflow: "hidden",
            background: "#111",
            // Visually hide when error is shown, but keep in DOM for cleanup
            minHeight: error ? 0 : 220,
            maxHeight: error ? 0 : 9999,
            transition: "min-height 0.2s",
          }}
        />

        {error && (
          <div style={{
            background: "#ff6b6b18", border: "1px solid #ff6b6b55",
            borderRadius: 10, padding: "14px 12px",
            fontSize: 13, color: "#ff9999", lineHeight: 1.7,
            whiteSpace: "pre-line", marginTop: 4,
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className={`scan-status${found ? " found" : ""}`}
          style={{ marginTop: 10, marginBottom: 4 }}>
          {msg}
        </div>

        <div className="modal-actions" style={{ marginTop: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ProductModal ─────────────────────────────────────────────────────────────
function ProductModal({ product, onSave, onClose, categories }) {
  const [form, setForm] = useState(
    product
      ? { ...product, minStock: product.minStock ?? 6 }
      : { name: "", category: "Básicos", type: "unit", price: "", stock: "", unit: "pza", barcode: "", img: "", minStock: 6 }
  );
  const [imgOk, setImgOk]         = useState(!!product?.img); // true once preview <img> loads OK
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeFlash, setBarcodeFlash] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const kbRef       = useRef(null); // forces virtual keyboard on Android HID
  const lastKeyTime = useRef(0);
  const physicalBuf = useRef("");

  // Physical barcode reader: chars arrive < 60 ms apart, ends with Enter
  const handleBarcodeKeyDown = (e) => {
    const now = Date.now();
    if (e.key === "Enter") {
      e.preventDefault();
      const wasPhysical = physicalBuf.current.length > 3;
      physicalBuf.current = "";
      setBarcodeFlash(true);
      setTimeout(() => setBarcodeFlash(false), 900);
      // Auto-save when physical reader fills the last field and form is ready
      if (wasPhysical && form.name && form.price) {
        onSave({ ...form, price: parseFloat(form.price), stock: parseFloat(form.stock) || 0, minStock: parseInt(form.minStock) || 6 });
      }
    } else if (e.key.length === 1) {
      const gap = now - lastKeyTime.current;
      physicalBuf.current = gap < 60 ? physicalBuf.current + e.key : e.key;
      lastKeyTime.current = now;
    }
  };

  const handleCameraCode = (code) => {
    set("barcode", code);
    setShowScanner(false);
    setBarcodeFlash(true);
    setTimeout(() => setBarcodeFlash(false), 1200);
  };

  return (
    <>
    {showScanner && <CameraScanner onCode={handleCameraCode} onClose={() => setShowScanner(false)} />}
    {/* Off-screen input — focus() summons the virtual keyboard when HID scanner suppresses it */}
    <input ref={kbRef} readOnly aria-hidden="true"
      style={{ position: "fixed", top: -999, left: -999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{product ? "Editar producto" : "Nuevo producto"}</h2>
          <button onClick={() => kbRef.current?.focus()} title="Mostrar teclado"
            style={{ background: "#252b3b", border: "1px solid #3a4158", borderRadius: 6,
              color: "#9ca3af", fontSize: 15, padding: "4px 8px", cursor: "pointer", lineHeight: 1 }}>⌨️</button>
        </div>
        <div className="modal-section">
          <div className="modal-label">Foto (URL)</div>
          {/* Preview — shown when form.img is set and loaded without error */}
          {form.img && imgOk && (
            <img src={form.img} alt="" onError={() => setImgOk(false)}
              style={{ width: "100%", maxHeight: 160, objectFit: "contain",
                borderRadius: 8, background: "#fff", marginBottom: 6 }} />
          )}
          <input className="modal-input" value={form.img || ""} placeholder="https://... (pegá URL de imagen)"
            onChange={e => { set("img", e.target.value); setImgOk(true); }}
            style={{ fontSize: 11, color: form.img ? "#e8eaf0" : "#6b7280" }} />
          {form.img && !imgOk && (
            <div style={{ marginTop: 4, fontSize: 11, color: "#fca5a5" }}>
              ⚠️ No se pudo cargar la imagen — verificá que la URL sea pública y termine en .jpg/.png/etc.
            </div>
          )}
        </div>
        <div className="modal-section">
          <div className="modal-label">Nombre</div>
          <input className="modal-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Nombre del producto" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="modal-section">
            <div className="modal-label">Categoría</div>
            <select className="select-input" value={form.category} onChange={e => set("category", e.target.value)}>
              {(categories?.length ? categories : CATEGORIES.filter(c => c !== "Todas")).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="modal-section">
            <div className="modal-label">Tipo</div>
            <select className="select-input" value={form.type} onChange={e => { set("type", e.target.value); set("unit", e.target.value === "kg" ? "kg" : "pza"); }}>
              <option value="unit">Por unidad</option>
              <option value="kg">Por kilo</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="modal-section">
            <div className="modal-label">Precio $</div>
            <input className="modal-input" type="number" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0.00" />
          </div>
          <div className="modal-section">
            <div className="modal-label">Stock</div>
            <input className="modal-input" type="number" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="modal-section">
            <div className="modal-label">Stock mínimo ⚠️</div>
            <input className="modal-input" type="number" min="0" value={form.minStock ?? 6} onChange={e => set("minStock", parseInt(e.target.value) || 0)} placeholder="6" />
          </div>
          <div className="modal-section">
            <div className="modal-label" style={{ color: "#6b7280", fontSize: 11 }}>Alerta de stock bajo cuando quede menos de este valor</div>
          </div>
        </div>
        <div className="modal-section">
          <div className="modal-label">Código de barras</div>
          <div className="barcode-row">
            <input
              className={`modal-input${barcodeFlash ? " barcode-scanned" : ""}`}
              value={form.barcode}
              onChange={e => set("barcode", e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Escaneá o ingresá el código"
              style={{ fontFamily: "monospace" }}
              autoComplete="off"
            />
            <button className="barcode-cam-btn" type="button" title="Escanear con cámara" onClick={() => setShowScanner(true)}>📷</button>
          </div>
          <div className="barcode-hint">
            {form.name && form.price
              ? "Lector físico: apuntá y el producto se guarda automáticamente al escanear"
              : "Completá nombre y precio primero para guardar automáticamente con el lector"}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => {
            if (form.name && form.price) onSave({ ...form, price: parseFloat(form.price), stock: parseFloat(form.stock) || 0, minStock: parseInt(form.minStock) || 6 });
          }}>Guardar</button>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
const AI_SUGGESTIONS = [
  "¿Cuánto vendí hoy?",
  "¿Cuál es mi producto más vendido?",
  "¿Qué productos tienen stock bajo?",
  "¿Cuál es mi ticket promedio?",
  "¿Qué método de pago usan más?",
  "¿Cuál fue el mejor día de la semana?",
  "¿A qué hora vendo más?",
  "Valor total del inventario",
];

function AIChat({ products, sales, userProfile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          businessContext: {
            bizName: "MI POS",
            products,
            sales,
            userRole: userProfile?.role || "owner",
          },
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              assistantContent += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
            if (data.error) throw new Error(data.error);
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${err.message || "No se pudo conectar con el asistente."}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-avatar">🤖</div>
        <div className="ai-panel-title">
          <h3>Asistente Mi POS</h3>
          <p>Datos en tiempo real · claude-sonnet</p>
        </div>
        {messages.length > 0 && (
          <button className="ai-clear-btn" onClick={() => setMessages([])}>Limpiar</button>
        )}
      </div>

      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <div className="ai-welcome-icon">🤖</div>
            <h3>Hola, soy tu asistente</h3>
            <p>Tengo acceso completo a tus ventas, inventario y reportes en tiempo real. Preguntame lo que quieras sobre tu negocio.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ${msg.role}`}>
            <div className="ai-msg-avatar">{msg.role === "user" ? "👤" : "🤖"}</div>
            <div className="ai-msg-bubble">{msg.content}</div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="ai-msg assistant">
            <div className="ai-msg-avatar">🤖</div>
            <div className="ai-msg-bubble">
              <div className="ai-typing"><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && (
        <div className="ai-suggestions">
          {AI_SUGGESTIONS.map((s) => (
            <button key={s} className="ai-suggestion" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="ai-input-row">
        <textarea
          ref={inputRef}
          className="ai-input"
          placeholder="Preguntá sobre tus ventas, stock o reportes..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button className="ai-send-btn" onClick={() => send()} disabled={!input.trim() || loading}>
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── ESC/POS ticket builder ───────────────────────────────────────────────────
function buildEscPos(sale, bizName = "MI POS") {
  const ESC = 0x1B;
  const GS  = 0x1D;
  const LF  = 0x0A;

  const bytes = [];

  // Inicializar impresora
  bytes.push(ESC, 0x40);

  // Función para agregar texto ASCII puro seguido de LF
  function texto(str) {
    const limpio = String(str)
      .replace(/[áàä]/gi, "a")
      .replace(/[éèë]/gi, "e")
      .replace(/[íìï]/gi, "i")
      .replace(/[óòö]/gi, "o")
      .replace(/[úùü]/gi, "u")
      .replace(/ñ/gi, "n")
      .replace(/[^\x20-\x7E]/g, "?");
    for (let i = 0; i < limpio.length; i++) {
      bytes.push(limpio.charCodeAt(i));
    }
    bytes.push(LF);
  }

  const fmtP  = (n) => "$" + (n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const SEP   = "--------------------------------";
  const W     = 32;
  const padR  = (s, n) => String(s).substring(0, n).padEnd(n, " ");
  const now   = new Date();

  // Encabezado: nombre del local centrado
  bytes.push(ESC, 0x61, 0x01);        // centrar
  bytes.push(GS,  0x21, 0x01);        // 2x altura
  bytes.push(ESC, 0x45, 0x01);        // bold on
  texto(String(bizName).toUpperCase().substring(0, W));
  bytes.push(GS,  0x21, 0x00);        // tamaño normal
  bytes.push(ESC, 0x45, 0x00);        // bold off
  bytes.push(ESC, 0x61, 0x00);        // alinear izquierda

  texto(SEP);
  texto("Fecha: " + now.toLocaleDateString("es-AR") + " " + now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
  texto("Folio: " + (String(sale.id || "").slice(-8) || "--------").toUpperCase());
  texto(SEP);

  (sale.items || []).forEach(item => {
    texto(padR(item.name || "", W));
    const qtyS = item.qty + "x @ " + fmtP(item.price);
    const totS = fmtP((item.price || 0) * (item.qty || 1));
    texto(padR(qtyS, W - totS.length) + totS);
  });

  texto(SEP);
  bytes.push(ESC, 0x61, 0x02);        // alinear derecha
  bytes.push(ESC, 0x45, 0x01);        // bold on
  bytes.push(GS,  0x21, 0x01);        // 2x altura
  texto("TOTAL: " + fmtP(sale.total));
  bytes.push(GS,  0x21, 0x00);
  bytes.push(ESC, 0x45, 0x00);
  bytes.push(ESC, 0x61, 0x00);        // izquierda

  texto(SEP);
  texto("Metodo: " + (sale.method || ""));
  if (sale.method === "Efectivo") {
    texto("Recibido: " + fmtP(sale.received));
    texto("Vuelto:   " + fmtP(Math.max(0, sale.change || 0)));
  }
  texto(SEP);
  bytes.push(ESC, 0x61, 0x01);        // centrar
  texto("Gracias por su compra!");
  bytes.push(ESC, 0x61, 0x00);
  bytes.push(LF, LF, LF);

  // Corte automático
  bytes.push(GS, 0x56, 0x41, 0x00);

  // Convertir a base64 con loop (no spread) para evitar stack overflow en arrays grandes
  let b64str = "";
  for (let i = 0; i < bytes.length; i++) b64str += String.fromCharCode(bytes[i]);
  return btoa(b64str);
}

// Canvas ticket for PNG download fallback
function renderTicketCanvas(sale, bizName = "MI POS") {
  const W = 380, PAD = 18, LH = 20;
  const FONT = "13px 'Courier New', monospace";
  const fmtP = (n) => "$" + (n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const now = new Date();

  const lines = [];
  const sep = () => lines.push({ t: "sep" });
  const txt = (s, bold = false, align = "left") => lines.push({ t: "txt", s, bold, align });
  const big = (s) => lines.push({ t: "big", s });

  big(bizName.toUpperCase());
  sep();
  txt("Fecha: " + now.toLocaleDateString("es-AR") + "  " + now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
  txt("Folio: " + (sale.id?.slice(-8) || "--------").toUpperCase());
  sep();
  (sale.items || []).forEach(item => {
    txt(item.name);
    txt(`${item.qty}x  ${fmtP((item.price || 0) * (item.qty || 1))}`, false, "right");
  });
  sep();
  txt("TOTAL: " + fmtP(sale.total), true, "right");
  sep();
  txt("Método: " + (sale.method || ""));
  if (sale.method === "Efectivo") {
    txt("Recibido: " + fmtP(sale.received));
    txt("Vuelto:   " + fmtP(Math.max(0, sale.change || 0)));
  }
  sep();
  txt("¡Gracias por su compra!", false, "center");
  txt("");

  let H = PAD * 2;
  lines.forEach(l => { H += l.t === "big" ? 34 : l.t === "sep" ? 14 : LH; });

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000000";

  let y = PAD;
  for (const l of lines) {
    if (l.t === "sep") {
      ctx.fillStyle = "#cccccc"; ctx.fillRect(PAD, y + 6, W - PAD * 2, 1); ctx.fillStyle = "#000"; y += 14;
    } else if (l.t === "big") {
      ctx.font = "bold 20px 'Courier New', monospace"; ctx.textAlign = "center";
      ctx.fillText(l.s, W / 2, y + 22); y += 34;
    } else {
      ctx.font = l.bold ? "bold " + FONT : FONT;
      ctx.textAlign = l.align === "center" ? "center" : l.align === "right" ? "right" : "left";
      ctx.fillText(l.s, l.align === "center" ? W / 2 : l.align === "right" ? W - PAD : PAD, y + 14);
      y += LH;
    }
  }
  return canvas;
}

// ─── WiFi Printer (WebSocket → TCP proxy) ────────────────────────────────────
const WIFI_PROXY_URL = "ws://localhost:9200";
function useWifiPrinter() {
  const [status, setStatus] = useState("idle");
  const [errMsg,  setErrMsg]  = useState("");
  const wsRef = useRef(null);

  const connect = () => new Promise((resolve) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) { resolve(true); return; }
    setStatus("connecting"); setErrMsg("");
    const ws = new WebSocket(WIFI_PROXY_URL);
    ws.binaryType = "arraybuffer";
    ws.onopen  = () => { wsRef.current = ws; setStatus("connected"); resolve(true); };
    ws.onerror = () => {
      wsRef.current = null;
      setStatus("error");
      setErrMsg("No se pudo conectar al proxy. Ejecutá printer-proxy/proxy.js en tu PC.");
      resolve(false);
    };
    ws.onclose = () => { wsRef.current = null; setStatus(s => s !== "error" ? "idle" : s); };
    ws.onmessage = (e) => {
      try {
        const txt = typeof e.data === "string" ? e.data : new TextDecoder().decode(e.data);
        const d = JSON.parse(txt);
        if (d.error) { setStatus("error"); setErrMsg(d.error); }
      } catch {}
    };
  });

  const print = async (bytes) => {
    const ok = await connect();
    if (!ok) return;
    setStatus("printing");
    try {
      wsRef.current.send(bytes);
      await new Promise(r => setTimeout(r, 800));
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setErrMsg(err.message || String(err));
    }
  };

  const reset = () => { setStatus("idle"); setErrMsg(""); };

  return { status, errMsg, print, reset };
}

// ─── PrintOptionsModal ────────────────────────────────────────────────────────
function PrintOptionsModal({ sale, bizName, userProfile, onClose }) {
  const uid = userProfile?.id;
  const [locations, setLocations] = useState([]);
  const [selLocId, setSelLocId]   = useState(() => localStorage.getItem("mi-pos-printer-location-id") || "");
  const wifiPrinter = useWifiPrinter();
  const wifiSt  = wifiPrinter.status;
  const wifiErr = wifiPrinter.errMsg;
  const [btSt, setBtSt]       = useState("idle");
  const [btErr, setBtErr]     = useState("");
  // buildEscPos devuelve base64 directamente
  const ticketB64 = useMemo(() => buildEscPos(sale, bizName), [sale, bizName]);

  // Diagnóstico: primeros 20 bytes en hex (deben empezar con 1B 40)
  const hexDiag = useMemo(() => {
    try {
      const raw = atob(ticketB64);
      const out = [];
      for (let i = 0; i < Math.min(20, raw.length); i++)
        out.push(raw.charCodeAt(i).toString(16).toUpperCase().padStart(2, "0"));
      return out.join(" ");
    } catch { return "ERROR al decodificar base64"; }
  }, [ticketB64]);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid, "settings", "printer"), snap => {
      const locs = snap.exists() ? (snap.data().locations || []) : PRINTER_DEFAULT_LOCS;
      setLocations(locs);
      if (!locs.find(l => l.id === selLocId) && locs.length > 0) {
        setSelLocId(locs[0].id);
      }
    });
    return unsub;
  }, [uid]);

  const selLoc    = locations.find(l => l.id === selLocId);
  const printerIp = selLoc?.ip || localStorage.getItem("mi-pos-printer-ip") || "http://10.0.0.100:3000";

  const pickLoc = (id) => {
    setSelLocId(id);
    localStorage.setItem("mi-pos-printer-location-id", id);
    wifiPrinter.reset();
  };

  const tryWifi = async () => {
    if (["printing","connecting","ok"].includes(wifiSt)) return;
    const bytes = Uint8Array.from(atob(ticketB64), c => c.charCodeAt(0));
    await wifiPrinter.print(bytes);
  };

  const tryBluetooth = async () => {
    if (["scanning","connecting","sending","ok"].includes(btSt)) return;
    setBtSt("scanning"); setBtErr("");
    try {
      if (!navigator.bluetooth)
        throw new Error("Web Bluetooth no disponible. Usá Chrome en Android o Desktop.");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "000018f0-0000-1000-8000-00805f9b34fb",
          "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        ],
      });
      setBtSt("connecting");
      const server = await device.gatt.connect();
      const SERVICE_UUIDS = ["000018f0-0000-1000-8000-00805f9b34fb","e7810a71-73ae-499d-8c15-faa9aef0c3f2"];
      const CHAR_UUIDS    = ["00002af1-0000-1000-8000-00805f9b34fb","bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"];
      let svc = null, chr = null;
      for (const u of SERVICE_UUIDS) { try { svc = await server.getPrimaryService(u); break; } catch {} }
      if (!svc) { const all = await server.getPrimaryServices(); svc = all[0]; }
      if (!svc) throw new Error("No se encontró el servicio de impresión. Asegurate de que sea una impresora térmica BT.");
      for (const u of CHAR_UUIDS) { try { chr = await svc.getCharacteristic(u); break; } catch {} }
      if (!chr) {
        const all = await svc.getCharacteristics();
        chr = all.find(c => c.properties.writeWithoutResponse || c.properties.write) || all[0];
      }
      if (!chr) throw new Error("No se encontró la característica de escritura.");
      setBtSt("sending");
      const btBytes = Uint8Array.from(atob(ticketB64), c => c.charCodeAt(0));
      const CHUNK = 512;
      for (let i = 0; i < btBytes.length; i += CHUNK) {
        const chunk = btBytes.slice(i, Math.min(i + CHUNK, btBytes.length));
        if (chr.properties.writeWithoutResponse) await chr.writeValueWithoutResponse(chunk);
        else await chr.writeValue(chunk);
        await new Promise(r => setTimeout(r, 50));
      }
      setBtSt("ok");
    } catch (err) {
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("cancel")) {
        setBtSt("idle"); return;
      }
      setBtSt("error"); setBtErr(err.message || "Error de Bluetooth");
    }
  };

  const downloadTicket = () => {
    const canvas = renderTicketCanvas(sale, bizName);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `ticket-${sale.id?.slice(-8) || "ticket"}.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const wifiBusy = wifiSt === "printing" || wifiSt === "connecting";
  const btBusy   = ["scanning","connecting","sending"].includes(btSt);
  const anyOk    = wifiSt === "ok" || btSt === "ok";
  const showDl   = wifiSt === "error" || btSt === "error" || anyOk;

  const stIcon = (st) =>
    st === "ok" ? "✅" : (["connecting","printing","scanning","sending"].includes(st) ? <span className="spin">⏳</span> : st === "error" ? "❌" : null);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 360 }}>
        <h2>🖨️ Imprimir ticket</h2>

        {/* WiFi */}
        <div className="print-section">
          <div className="print-section-head">
            <span className="print-section-icon">🌐</span>
            <div style={{ flex: 1 }}>
              <div className="print-section-title">WiFi</div>
              <div className="print-section-sub">
                {selLoc ? selLoc.name : printerIp}
              </div>
            </div>
            <span style={{ fontSize: 18 }}>{stIcon(wifiSt)}</span>
          </div>

          {locations.length > 1 && (
            <select className="loc-select" value={selLocId}
              onChange={e => pickLoc(e.target.value)}
              disabled={wifiBusy || wifiSt === "ok"}>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} — {l.ip}</option>
              ))}
            </select>
          )}
          {locations.length === 0 && (
            <div className="print-section-sub" style={{ marginTop: 4, color: "#f87171" }}>
              Sin ubicaciones configuradas. Agregá una en Ajustes.
            </div>
          )}

          {wifiSt === "ok"    && <div className="print-ok">✅ Imprimido correctamente</div>}
          {wifiSt === "error" && <div className="print-err">{wifiErr}</div>}
          {wifiSt !== "ok" && (
            <button className="btn-primary"
              style={{ width: "100%", marginTop: 8, opacity: wifiBusy ? 0.6 : 1 }}
              onClick={tryWifi} disabled={wifiBusy || locations.length === 0}>
              {wifiSt === "printing" ? "Imprimiendo..." : "🖨️ Imprimir por WiFi"}
            </button>
          )}
        </div>

        {/* Bluetooth */}
        <div className="print-section">
          <div className="print-section-head">
            <span className="print-section-icon">📡</span>
            <div style={{ flex: 1 }}>
              <div className="print-section-title">Bluetooth</div>
              <div className="print-section-sub">Impresoras térmicas pareadas</div>
            </div>
            <span style={{ fontSize: 18 }}>{stIcon(btSt)}</span>
          </div>
          {btSt === "ok"    && <div className="print-ok">✅ Imprimido correctamente</div>}
          {btSt === "error" && <div className="print-err">{btErr}</div>}
          {btSt !== "ok" && (
            <button className="btn-secondary" style={{ width: "100%", marginTop: 8, opacity: btBusy ? 0.6 : 1 }}
              onClick={tryBluetooth} disabled={btBusy}>
              {btSt === "scanning" ? "Buscando..." : btSt === "connecting" ? "Conectando..." : btSt === "sending" ? "Enviando..." : "📡 Imprimir por Bluetooth"}
            </button>
          )}
        </div>

        {/* Fallback download */}
        {showDl && (
          <div className="print-section">
            <div className="print-section-head">
              <span className="print-section-icon">⬇️</span>
              <div>
                <div className="print-section-title">Sin impresora</div>
                <div className="print-section-sub">Descargá el ticket como imagen PNG</div>
              </div>
            </div>
            <button className="btn-secondary" style={{ width: "100%", marginTop: 8 }} onClick={downloadTicket}>
              ⬇️ Descargar ticket (.png)
            </button>
          </div>
        )}

        {/* Diagnóstico hex — ayuda a verificar que los datos ESC/POS son correctos */}
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 11, color: "#6b7280", cursor: "pointer", userSelect: "none" }}>
            🔬 Diagnóstico (primeros 20 bytes)
          </summary>
          <div style={{ marginTop: 8, background: "#111827", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: hexDiag.startsWith("1B 40") ? "#00c896" : "#f87171", letterSpacing: "0.05em", wordBreak: "break-all" }}>
              {hexDiag}
            </div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
              {hexDiag.startsWith("1B 40")
                ? "✅ Bytes correctos — el problema está en el servidor"
                : "❌ Bytes incorrectos — el problema está en la generación del ticket"}
            </div>
            <div style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>
              Deben empezar con: <span style={{ color: "#e8eaf0" }}>1B 40</span> (ESC @)
            </div>
          </div>
        </details>

        <button className="btn-secondary" style={{ width: "100%", marginTop: 12 }} onClick={onClose}>
          {anyOk ? "Cerrar" : "Omitir impresión"}
        </button>
      </div>
    </div>
  );
}

// ─── SuccessModal ──────────────────────────────────────────────────────────────
function SuccessModal({ sale, bizName, userProfile, onClose }) {
  const [printing, setPrinting] = useState(false);
  if (printing) return <PrintOptionsModal sale={sale} bizName={bizName} userProfile={userProfile} onClose={onClose} />;
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: "center" }}>
        <div className="success-icon">✅</div>
        <h2 style={{ marginBottom: 12 }}>¡Venta registrada!</h2>
        <div className="success-details">
          <div className="success-row"><span>Folio</span><span style={{ fontFamily: "monospace" }}>{sale.id?.slice(-8)}</span></div>
          <div className="success-row"><span>Método</span><span>{sale.method}</span></div>
          {sale.method === "Efectivo" && <><div className="success-row"><span>Recibido</span><span>{fmt(sale.received)}</span></div><div className="success-row"><span>Vuelto</span><span>{fmt(Math.max(0, sale.change))}</span></div></>}
          <div className="success-row"><span>Total</span><span>{fmt(sale.total)}</span></div>
        </div>
        <button className="btn-secondary" onClick={() => setPrinting(true)} style={{ width: "100%", marginTop: 14 }}>🖨️ Imprimir ticket</button>
        <button className="btn-primary" onClick={onClose} style={{ width: "100%", marginTop: 8 }}>Nueva venta</button>
      </div>
    </div>
  );
}

// ─── SaleView ─────────────────────────────────────────────────────────────────
function SaleView({ products, userProfile, categories, localName }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("mi-pos-cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [kgModal, setKgModal] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [offLoading, setOffLoading]   = useState(false);  // fetching Open Food Facts
  const [offModal, setOffModal]       = useState(null);   // { barcode, name, brand, found }
  const [noStockId, setNoStockId]     = useState(null);   // product id flashing red
  const [stockToast, setStockToast]   = useState(null);   // red "sin stock" toast
  const [lowStockToast, setLowStockToast] = useState(null); // yellow "stock bajo" toast
  const [blockNoStock, setBlockNoStock] = useState(() => {
    const v = localStorage.getItem("mi-pos-block-no-stock");
    return v === null ? true : v === "true"; // default: bloquear
  });
  const noStockTimer   = useRef(null);
  const lowStockTimer  = useRef(null);
  const barcodeBuffer = useRef("");
  const barcodeTimer  = useRef(null);
  const kbRef         = useRef(null); // hidden input — focus() forces virtual keyboard on Android
  // Refs so the keydown handler never sees stale closures and never re-registers
  const barcodeProductsRef    = useRef(products);
  const handleProductClickRef = useRef(null);   // assigned after function is defined
  const handleNotFoundRef     = useRef(null);   // assigned after function is defined
  useEffect(() => { barcodeProductsRef.current = products; }, [products]);

  // Persiste el carrito en localStorage para que sobreviva la navegación entre secciones
  useEffect(() => {
    try {
      if (cart.length === 0) localStorage.removeItem("mi-pos-cart");
      else localStorage.setItem("mi-pos-cart", JSON.stringify(cart));
    } catch { /* storage lleno o modo privado — ignorar */ }
  }, [cart]);

  // ── HID Bluetooth / USB barcode scanner (behaves like a keyboard) ──────────
  // Strategy: scanners send chars < 50 ms apart and finish with Enter.
  // Humans type > 150 ms apart. The 100 ms timer is the discriminator.
  // Guard: skip when the active element is a text input (user typing manually).
  useEffect(() => {
    const onKey = (e) => {
      // Don't intercept keystrokes while the user is typing in a text field
      const tag = document.activeElement?.tagName ?? "";
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
        || document.activeElement?.isContentEditable;
      if (isEditable) return;

      if (e.key === "Enter") {
        const code = barcodeBuffer.current.trim();
        barcodeBuffer.current = "";
        clearTimeout(barcodeTimer.current);
        if (code.length >= 3) {
          const found = barcodeProductsRef.current.find(p => p.barcode === code);
          if (found) handleProductClickRef.current?.(found);
          else handleNotFoundRef.current?.(code);
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        clearTimeout(barcodeTimer.current);
        // Auto-clear if chars stop arriving (not a scanner burst)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = ""; }, 100);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // register once — refs keep it current without re-registering

  const filtered = products.filter(p => {
    const matchCat = cat === "Todas" || p.category === cat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch;
  });

  const addToCart = (product, qty = 1) => {
    setCart(c => {
      const ex = c.find(i => i.id === product.id);
      if (ex) return c.map(i => i.id === product.id ? { ...i, qty: parseFloat((i.qty + qty).toFixed(3)) } : i);
      return [...c, { ...product, qty }];
    });
    setLastScanned(product.id);
    setTimeout(() => setLastScanned(null), 1500);
  };

  const handleProductClick = (p) => {
    if (p.stock <= 0) {
      // Always flash the card red and show the sin-stock toast as warning
      clearTimeout(noStockTimer.current);
      setNoStockId(p.id);
      setStockToast(p.name);
      noStockTimer.current = setTimeout(() => { setNoStockId(null); setStockToast(null); }, 2400);
      if (blockNoStock) return; // toggle ON → block completely
      // toggle OFF → fall through and add to cart anyway
    } else if (p.stock <= (p.minStock ?? 6)) {
      // Stock > 0 but at or below minimum → yellow warning, always allow
      clearTimeout(lowStockTimer.current);
      setLowStockToast({ name: p.name, qty: p.stock, unit: p.unit || (p.type === "kg" ? "kg" : "u") });
      lowStockTimer.current = setTimeout(() => setLowStockToast(null), 2800);
    }
    if (p.type === "kg") setKgModal(p); else addToCart(p, 1);
  };
  // Keep refs current every render so the keydown handler always calls latest versions
  handleProductClickRef.current = handleProductClick;

  // ── Open Food Facts lookup — called when barcode is not in local inventory ──
  const handleNotFound = async (barcode) => {
    setScannerOpen(false);
    setOffLoading(true);
    setOffModal(null);
    try {
      const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
      const json = await res.json();
      if (json.status === 1 && json.product) {
        const p     = json.product;
        const name  = p.product_name_es || p.product_name || p.abbreviated_product_name || "";
        const brand = p.brands || "";
        // Prefer the Spanish front image, fall back to generic front or any front image
        const img   = p.image_front_small_url || p.image_front_url || p.image_small_url || p.image_url || "";
        setOffModal({ barcode, name: name || brand, brand, img, found: true });
      } else {
        setOffModal({ barcode, name: "", brand: "", img: "", found: false });
      }
    } catch {
      setOffModal({ barcode, name: "", brand: "", img: "", found: false });
    } finally {
      setOffLoading(false);
    }
  };
  handleNotFoundRef.current = handleNotFound;
  const updateQty = (id, val) => { const n = parseFloat(val); if (isNaN(n) || n <= 0) return setCart(c => c.filter(i => i.id !== id)); setCart(c => c.map(i => i.id === id ? { ...i, qty: n } : i)); };
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const localId = useContext(LocalCtx);
  const handlePay = async (method, received, change) => {
    const saleData = { method, received, change, total, items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, unit: i.unit })), date: serverTimestamp(), cashier: userProfile?.email || "" };

    // 1. Registrar la venta — único await bloqueante
    const saleRef = await addDoc(collection(db, "locals", localId, "sales"), saleData);

    // 2. Mostrar el modal de éxito inmediatamente (no esperar las actualizaciones de stock)
    setSuccessModal({ ...saleData, id: saleRef.id });
    setCart([]);
    setPayModal(false);

    // 3. Actualizar stock de todos los productos en paralelo en el fondo
    const stockSnapshot = cart; // captura el carrito antes de que se limpie
    Promise.all(
      stockSnapshot.map(item => {
        const newStock = Math.max(0, (item.stock || 0) - item.qty);
        return updateDoc(doc(db, "locals", localId, "products", item.id), { stock: newStock });
      })
    ).catch(() => {/* onSnapshot resincroniza si alguna falla */});
  };

  const getCatEmoji = (cat) => ({ "Lácteos": "🥛", "Bebidas": "🥤", "Higiene": "🧴", "Limpieza": "🧹", "Frutas y Verd.": "🥦", "Snacks": "🍪", "Enlatados": "🥫", "Panadería": "🍞" }[cat] || "📦");

  return (
    <div className="content sale-content">
      {scannerOpen && <ScannerModal products={products}
        onFound={p => { setScannerOpen(false); handleProductClick(p); }}
        onNotFound={code => handleNotFound(code)}
        onClose={() => setScannerOpen(false)} />}
      {offLoading && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: "center", padding: "32px 24px", maxWidth: 300 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Buscando en Open Food Facts...</div>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>Consultando base de datos global de productos</div>
          </div>
        </div>
      )}
      {offModal && (
        <OffModal
          barcode={offModal.barcode}
          offName={offModal.name}
          offBrand={offModal.brand}
          offImg={offModal.img}
          found={offModal.found}
          categories={categories}
          onClose={() => setOffModal(null)}
        />
      )}
      {stockToast && (
        <div className="no-stock-toast">
          <span>🚫</span>
          <span>{blockNoStock ? "Sin stock" : "⚠️ Sin stock"} · {stockToast}</span>
        </div>
      )}
      {lowStockToast && (
        <div className="low-stock-toast">
          <span>⚠️</span>
          <span>Stock bajo · {lowStockToast.name} ({lowStockToast.qty} {lowStockToast.unit})</span>
        </div>
      )}
      {kgModal && <KgModal product={kgModal} onConfirm={kg => { addToCart(kgModal, kg); setKgModal(null); }} onClose={() => setKgModal(null)} />}
      {payModal && <PayModal total={total} onConfirm={handlePay} onClose={() => setPayModal(false)} />}
      {successModal && <SuccessModal sale={successModal} bizName={localName} userProfile={userProfile} onClose={() => setSuccessModal(null)} />}
      <div className="products-area">
        <div className="search-row">
          {/* Hidden input whose sole purpose is receiving focus to summon the virtual keyboard.
              Positioned off-screen so it never shows; readOnly prevents any text insertion. */}
          <input ref={kbRef} readOnly aria-hidden="true"
            style={{ position:"fixed", top:-999, left:-999, width:1, height:1, opacity:0, pointerEvents:"none" }} />
          <div className="search-box"><span className="search-icon">🔍</span><input placeholder="Nombre o código..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="scan-btn" title="Mostrar teclado" onClick={() => kbRef.current?.focus()}
            style={{ padding:"8px 10px", fontSize:16 }}>⌨️</button>
          <button className="scan-btn" onClick={() => setScannerOpen(true)}>📷 Scan</button>
        </div>
        <div className="stock-toggle-row">
          <label className="toggle-switch" title="Bloquear productos sin stock">
            <input type="checkbox" checked={blockNoStock} onChange={e => {
              setBlockNoStock(e.target.checked);
              localStorage.setItem("mi-pos-block-no-stock", String(e.target.checked));
            }} />
            <span className="toggle-slider" />
          </label>
          <span style={{ color: blockNoStock ? "#e8eaf0" : "#6b7280" }}>
            Bloquear sin stock
          </span>
          {!blockNoStock && (
            <span style={{ color: "#d97706", fontSize: 11, marginLeft: 2 }}>— permite vender aunque haya 0 unidades</span>
          )}
        </div>
        <div className="categories">{["Todas", ...(categories?.length ? categories : CATEGORIES.filter(c => c !== "Todas"))].map(c => <button key={c} className={`cat-btn${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</button>)}</div>
        <div className="grid">
          {filtered.map(p => (
            <div key={p.id} className={`product-card${p.stock < (p.minStock ?? 6) ? " low-stock" : ""}${noStockId === p.id ? " no-stock-flash" : ""}`} onClick={() => handleProductClick(p)}>
              <div className="prod-img">{p.img ? <img src={p.img} alt="" /> : getCatEmoji(p.category)}</div>
              <span className={`type-badge ${p.type === "kg" ? "type-kg" : "type-unit"}`}>{p.type === "kg" ? "⚖️ kg" : "📦 unid"}</span>
              <div className="product-name">{p.name}</div>
              <div className="product-cat">{p.category}</div>
              <div className="product-price">{fmt(p.price)}</div>
              <div className={`product-stock ${p.stock < (p.minStock ?? 6) ? "stock-low" : "stock-ok"}`}>Stock: {p.stock} {p.unit}</div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: "#6b7280", fontSize: 12, gridColumn: "1/-1", padding: 16 }}>No se encontraron productos</div>}
        </div>
      </div>
      <div className="cart">
        <div className="cart-header">
          <h2>🛒 Carrito</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="sync-indicator"><div className="sync-dot" /><span>En tiempo real</span></div>
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </div>
        </div>
        <div className="cart-items">
          {cart.length === 0 && <div className="cart-empty">Tocá un producto o escaneá un código</div>}
          {cart.map(item => (
            <div key={item.id} className={`cart-item${lastScanned === item.id ? " highlight" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="cart-item-name">{item.name}</div>
                <button className="del-btn" onClick={() => setCart(c => c.filter(i => i.id !== item.id))}>✕</button>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{fmt(item.price)} / {item.unit}</div>
              <div className="cart-item-controls">
                {item.type === "unit" && <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>}
                <input className="qty-input" type="number" step={item.type === "kg" ? "0.01" : "1"} min="0.01" value={item.qty} onChange={e => updateQty(item.id, e.target.value)} />
                {item.type === "unit" && <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>}
                <span style={{ fontSize: 10, color: "#9ca3af" }}>{item.unit}</span>
                <span className="item-subtotal">{fmt(item.price * item.qty)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-footer">
          <div className="total-line"><span className="total-label">Total</span><span className="grand-total">{fmt(total)}</span></div>
          <button className="pay-btn" disabled={cart.length === 0} onClick={() => setPayModal(true)}>Cobrar {fmt(total)}</button>
          {cart.length > 0 && <button className="clear-btn" onClick={() => setCart([])}>Vaciar carrito</button>}
        </div>
      </div>
    </div>
  );
}

// ─── CategoriesModal ──────────────────────────────────────────────────────────
function CategoriesModal({ categories, onClose }) {
  const [list, setList]       = useState([...categories]);
  const [newCat, setNewCat]   = useState("");
  const [editing, setEditing] = useState(null); // { idx, value }
  const [saving, setSaving]   = useState(false);
  const localId = useContext(LocalCtx);

  const persist = async (newList) => {
    setSaving(true);
    await setDoc(doc(db, "locals", localId, "settings", "categories"), { list: newList });
    setSaving(false);
  };

  const add = async () => {
    const v = newCat.trim();
    if (!v || list.includes(v)) return;
    const next = [...list, v];
    setList(next); setNewCat("");
    await persist(next);
  };

  const remove = async (idx) => {
    if (!confirm(`¿Eliminar la categoría "${list[idx]}"?`)) return;
    const next = list.filter((_, i) => i !== idx);
    setList(next);
    await persist(next);
  };

  const confirmEdit = async () => {
    if (!editing) return;
    const v = editing.value.trim();
    if (!v) { setEditing(null); return; }
    const next = list.map((c, i) => i === editing.idx ? v : c);
    setList(next); setEditing(null);
    await persist(next);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>🏷️ Categorías</h2>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          Agregá, editá o eliminá las categorías de tus productos.
        </p>
        <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 12 }}>
          {list.map((cat, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #2d3448" }}>
              {editing?.idx === idx ? (
                <>
                  <input
                    value={editing.value}
                    onChange={e => setEditing({ ...editing, value: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditing(null); }}
                    autoFocus
                    style={{ flex: 1, background: "#1a1f2e", border: "1px solid #00c896", borderRadius: 6, color: "#e8eaf0", padding: "6px 8px", fontSize: 13, outline: "none" }}
                  />
                  <button onClick={confirmEdit} disabled={saving} style={{ background: "#00c896", border: "none", borderRadius: 6, color: "#000", fontWeight: 700, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✓</button>
                  <button onClick={() => setEditing(null)} style={{ background: "#3a4158", border: "none", borderRadius: 6, color: "#e8eaf0", padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13 }}>{cat}</span>
                  <button className="btn-edit" onClick={() => setEditing({ idx, value: cat })}>✏️</button>
                  <button className="btn-del"  onClick={() => remove(idx)}>🗑</button>
                </>
              )}
            </div>
          ))}
          {list.length === 0 && <div style={{ color: "#6b7280", fontSize: 12, textAlign: "center", padding: 16 }}>Sin categorías</div>}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="modal-input"
            placeholder="Nueva categoría..."
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={add} disabled={!newCat.trim() || saving} style={{ whiteSpace: "nowrap", opacity: saving ? 0.6 : 1 }}>
            + Agregar
          </button>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── InventoryView ─────────────────────────────────────────────────────────────
function InventoryView({ products, userProfile, categories }) {
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null);
  const [showCats, setShowCats]   = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null); // {ok, skipped, error?}
  const importRef                 = useRef(null);
  const localId = useContext(LocalCtx);
  const canEdit = userProfile?.role === "owner" || userProfile?.permissions?.editInventory;

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search)));

  const handleSave = async (p) => {
    const { id, ...data } = p;
    if (id) await setDoc(doc(db, "locals", localId, "products", id), data);
    else await addDoc(collection(db, "locals", localId, "products"), data);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este producto?")) await deleteDoc(doc(db, "locals", localId, "products", id));
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";            // reset so same file can be picked again
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const raw  = JSON.parse(text);
      if (!Array.isArray(raw)) throw new Error("El JSON debe ser un array de productos.");

      // Build a set of existing barcodes for fast lookup (ignore blanks)
      const existingBarcodes = new Set(
        products.map(p => p.barcode).filter(Boolean)
      );

      const toInsert = [];
      const skipped  = [];
      for (const item of raw) {
        const barcode = String(item.barcode ?? "").trim();
        if (barcode && existingBarcodes.has(barcode)) {
          skipped.push(barcode);
          continue;
        }
        toInsert.push({
          barcode:  barcode || null,
          name:     String(item.name ?? "Sin nombre").trim(),
          category: String(item.category ?? "General").trim(),
          price:    parseFloat(item.price)   || 0,
          stock:    parseFloat(item.stock)   ?? 0,
          minStock: parseFloat(item.minStock) ?? 5,
          type:     item.type === "kg" ? "kg" : "unit",
          unit:     item.type === "kg" ? "kg" : "u",
          img:      null,
        });
      }

      // Insert one by one (Firestore batches are capped at 500; for large sets this is fine)
      for (const data of toInsert) {
        await addDoc(collection(db, "locals", localId, "products"), data);
      }

      setImportMsg({ ok: toInsert.length, skipped: skipped.length });
    } catch (err) {
      setImportMsg({ ok: 0, skipped: 0, error: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="content">
      {/* Hidden file picker — triggered by the Importar button */}
      <input ref={importRef} type="file" accept=".json,application/json"
        style={{ display: "none" }} onChange={handleImport} />
      {modal && <ProductModal product={modal === "new" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} categories={categories} />}
      {showCats && <CategoriesModal categories={categories} onClose={() => setShowCats(false)} />}
      <div className="inv-area">
        {importMsg && (
          <div style={{ background: importMsg.error ? "#3b0d0d" : "#0d2b1e", border: `1px solid ${importMsg.error ? "#ff6b6b" : "#00c896"}`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13,
            color: importMsg.error ? "#ff6b6b" : "#00c896", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              {importMsg.error
                ? `❌ Error: ${importMsg.error}`
                : `✅ ${importMsg.ok} producto${importMsg.ok !== 1 ? "s" : ""} importado${importMsg.ok !== 1 ? "s" : ""}${importMsg.skipped ? ` · ${importMsg.skipped} omitido${importMsg.skipped !== 1 ? "s" : ""} (código ya existe)` : ""}`}
            </span>
            <button onClick={() => setImportMsg(null)}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div className="search-box" style={{ flex: 1 }}><span className="search-icon">🔍</span><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          {canEdit && <button className="btn-add" style={{ background: "#3a4158", border: "1px solid #4a5168", fontSize: 18, padding: "6px 10px" }} onClick={() => setShowCats(true)} title="Gestionar categorías">🏷️</button>}
          {canEdit && (
            <button className="btn-add" disabled={importing}
              style={{ background: "#1e2a3b", border: "1px solid #3a5168", color: "#7ec8e3", opacity: importing ? 0.6 : 1 }}
              onClick={() => importRef.current?.click()}
              title="Importar productos desde JSON">
              {importing ? "⏳" : "📥"} Importar
            </button>
          )}
          {canEdit && <button className="btn-add" onClick={() => setModal("new")}>+ Nuevo</button>}
        </div>
        {!canEdit && <div style={{ background: "#fbbf2422", border: "1px solid #fbbf2444", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: "#fbbf24" }}>👁️ Solo lectura — no tenés permiso para editar</div>}
        <table className="inv-table">
          <thead><tr><th>Foto</th><th>Producto</th><th>Tipo</th><th>Precio</th><th>Stock</th>{canEdit && <th></th>}</tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.img ? <img src={p.img} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} alt="" /> : <span style={{ fontSize: 18 }}>📦</span>}</td>
                <td style={{ fontWeight: 500 }}>{p.name}<br /><span style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>{p.barcode || "—"}</span></td>
                <td><span className={`type-badge ${p.type === "kg" ? "type-kg" : "type-unit"}`}>{p.type === "kg" ? "kg" : "unid"}</span></td>
                <td style={{ fontFamily: "monospace", color: "#00c896" }}>{fmt(p.price)}</td>
                <td style={{ color: p.stock < (p.minStock ?? 6) ? "#ff6b6b" : "#e8eaf0" }}>{p.stock} {p.unit}</td>
                {canEdit && <td><button className="btn-edit" onClick={() => setModal(p)}>✏️</button><button className="btn-del" onClick={() => handleDelete(p.id)}>🗑</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── HistoryView ──────────────────────────────────────────────────────────────
function HistoryView({ sales }) {
  // YYYY-MM-DD in local time — used as the canonical date key for filtering
  const todayStr = new Date().toLocaleDateString("en-CA");
  const [filterDate, setFilterDate] = useState(todayStr);

  const getSaleDate = (sale) =>
    sale.date?.toDate ? sale.date.toDate().toLocaleDateString("en-CA") : null;

  // Today's stats — real-time because `sales` comes from onSnapshot in the parent
  const todaySales  = sales.filter(s => getSaleDate(s) === todayStr);
  const todayTotal  = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayTxns   = todaySales.length;

  // Filtered list for the date picker
  const isToday        = filterDate === todayStr;
  const filteredSales  = isToday ? todaySales : sales.filter(s => getSaleDate(s) === filterDate);
  const filteredTotal  = filteredSales.reduce((sum, s) => sum + s.total, 0);

  // Human-readable date in Spanish from a YYYY-MM-DD string
  const fmtLabel = (str) => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long",
    });
  };

  return (
    <div className="content">
      <div className="hist-area">

        {/* ── TODAY BANNER — always visible, always real-time ── */}
        <div style={{
          background: "linear-gradient(135deg, #004d38 0%, #006b4f 100%)",
          border: "1px solid #00c896",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: "#00c896", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            📅 Hoy · {fmtLabel(todayStr)}
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "monospace", color: "#fff", lineHeight: 1.1, marginBottom: 4 }}>
            {fmt(todayTotal)}
          </div>
          <div style={{ fontSize: 12, color: "#6ee7b7" }}>
            {todayTxns === 0
              ? "Sin ventas aún"
              : `${todayTxns} ${todayTxns === 1 ? "venta" : "ventas"} · Ticket prom. ${fmt(todayTotal / todayTxns)}`}
          </div>
        </div>

        {/* ── DATE FILTER ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div style={{ flex: 1, background: "#252b3b", border: "1px solid #3a4158", borderRadius: 8, padding: "0 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>📆</span>
            <input
              type="date"
              value={filterDate}
              max={todayStr}
              onChange={e => e.target.value && setFilterDate(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#e8eaf0", fontSize: 13, padding: "8px 0", outline: "none", flex: 1, colorScheme: "dark" }}
            />
          </div>
          {!isToday && (
            <button
              onClick={() => setFilterDate(todayStr)}
              style={{ background: "#3a4158", border: "1px solid #4a5168", borderRadius: 8, color: "#e8eaf0", fontSize: 12, padding: "8px 12px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Hoy
            </button>
          )}
        </div>

        {/* ── SELECTED DATE SUMMARY (shown only when filtering a past day) ── */}
        {!isToday && (
          <div style={{
            background: "#252b3b", border: "1px solid #3a4158",
            borderRadius: 10, padding: "12px 14px", marginBottom: 12,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "#e8eaf0", fontWeight: 600, textTransform: "capitalize" }}>
                {fmtLabel(filterDate)}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                {filteredSales.length === 0
                  ? "Sin ventas"
                  : `${filteredSales.length} ${filteredSales.length === 1 ? "venta" : "ventas"}`}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "#00c896" }}>
              {fmt(filteredTotal)}
            </div>
          </div>
        )}

        {/* ── SALES LIST ── */}
        {filteredSales.length === 0 ? (
          <div style={{ color: "#6b7280", textAlign: "center", padding: "30px 0", fontSize: 13 }}>
            Sin ventas para esta fecha
          </div>
        ) : (
          filteredSales.map(sale => (
            <div key={sale.id} className="hist-item">
              <div className="hist-header">
                <span className="hist-id">{sale.id?.slice(-8)}</span>
                <span className="hist-total">{fmt(sale.total)}</span>
              </div>
              <div className="hist-meta">
                ⏰ {sale.date?.toDate
                  ? sale.date.toDate().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                  : "—"} · 💳 {sale.method} · 👤 {sale.cashier}
              </div>
              <div className="hist-products">
                {sale.items?.map(i => `${i.name} × ${i.qty} ${i.unit}`).join(" · ")}
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}

// ─── ReportsView ──────────────────────────────────────────────────────────────
const CHART_COLORS = ["#00c896","#60a5fa","#fb923c","#a78bfa","#fbbf24","#f472b6","#34d399","#f87171"];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const FULL_DAY_NAMES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const TIME_SLOTS = [
  { label: "Mañana\n6-12h",  key: "manana",  min: 6,  max: 12 },
  { label: "Mediodía\n12-15h", key: "mediodia", min: 12, max: 15 },
  { label: "Tarde\n15-20h", key: "tarde",   min: 15, max: 20 },
  { label: "Noche\n20-24h", key: "noche",   min: 20, max: 24 },
];

function parseDate(sale) {
  try {
    if (sale.date?.seconds) return new Date(sale.date.seconds * 1000);
    if (sale.date?.toDate) return sale.date.toDate();
    if (sale.date) return new Date(sale.date);
  } catch {}
  return null;
}

function startOf(unit, ref = new Date()) {
  const d = new Date(ref);
  if (unit === "day")   { d.setHours(0,0,0,0); return d; }
  if (unit === "week")  { d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d; }
  if (unit === "month") { d.setHours(0,0,0,0); d.setDate(1); return d; }
  if (unit === "year")  { d.setHours(0,0,0,0); d.setMonth(0,1); return d; }
  return d;
}

function filterByRange(sales, range, from, to) {
  const now = new Date();
  let start, end;
  if (range === "hoy")   { start = startOf("day"); end = now; }
  else if (range === "semana") { start = startOf("week"); end = now; }
  else if (range === "mes")    { start = startOf("month"); end = now; }
  else if (range === "año")    { start = startOf("year"); end = now; }
  else { // custom
    start = from ? new Date(from + "T00:00:00") : new Date(0);
    end   = to   ? new Date(to   + "T23:59:59") : now;
  }
  return sales.filter(s => { const d = parseDate(s); return d && d >= start && d <= end; });
}

function prevPeriodSales(sales, range) {
  const now = new Date();
  let start, end;
  if (range === "hoy") {
    end   = startOf("day");
    start = new Date(end.getTime() - 86400000);
  } else if (range === "semana") {
    end   = startOf("week");
    start = new Date(end.getTime() - 7 * 86400000);
  } else if (range === "mes") {
    end   = startOf("month");
    const prev = new Date(end); prev.setMonth(prev.getMonth() - 1);
    start = startOf("month", prev);
  } else if (range === "año") {
    end   = startOf("year");
    const prev = new Date(end); prev.setFullYear(prev.getFullYear() - 1);
    start = startOf("year", prev);
  } else return [];
  return sales.filter(s => { const d = parseDate(s); return d && d >= start && d < end; });
}

function pct(curr, prev) {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return "+100";
  const v = ((curr - prev) / prev) * 100;
  return (v >= 0 ? "+" : "") + v.toFixed(1);
}

const RiTooltip = ({ active, payload, label, money }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1e2438", border:"1px solid #3a4158", borderRadius:8, padding:"6px 10px", fontSize:11 }}>
      <div style={{ color:"#9ca3af", marginBottom:2 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#00c896", fontWeight:600 }}>
          {money ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

function ReportsView({ sales, products }) {
  const [tab, setTab]         = useState("dashboard");
  const [range, setRange]     = useState("mes");
  const [customFrom, setFrom] = useState("");
  const [customTo,   setTo]   = useState("");

  const filtered = useMemo(() => filterByRange(sales, range, customFrom, customTo), [sales, range, customFrom, customTo]);
  const prev     = useMemo(() => prevPeriodSales(sales, range), [sales, range]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalRev  = filtered.reduce((s, v) => s + (v.total || 0), 0);
  const prevRev   = prev.reduce((s, v) => s + (v.total || 0), 0);
  const txCount   = filtered.length;
  const prevTx    = prev.length;
  const avgTicket = txCount > 0 ? totalRev / txCount : 0;
  const prevAvg   = prevTx  > 0 ? prevRev  / prevTx  : 0;
  const totalItems = filtered.reduce((s, v) => s + (v.items||[]).reduce((ss, i) => ss + (i.qty||0), 0), 0);

  // ── Ventas por día de semana ─────────────────────────────────────────────
  const byDow = useMemo(() => {
    const acc = Array.from({length:7}, (_,i) => ({ name: DAY_NAMES[i], monto: 0, txn: 0 }));
    filtered.forEach(s => { const d = parseDate(s); if (d) { acc[d.getDay()].monto += s.total||0; acc[d.getDay()].txn++; } });
    return acc;
  }, [filtered]);

  // ── Ventas por franja horaria ────────────────────────────────────────────
  const bySlot = useMemo(() => {
    const acc = TIME_SLOTS.map(sl => ({ name: sl.label, monto: 0, txn: 0, min: sl.min, max: sl.max }));
    filtered.forEach(s => {
      const d = parseDate(s);
      if (!d) return;
      const h = d.getHours();
      const sl = acc.find(a => h >= a.min && h < a.max);
      if (sl) { sl.monto += s.total||0; sl.txn++; }
    });
    return acc;
  }, [filtered]);

  // ── Tendencia 30 días ────────────────────────────────────────────────────
  const trend30 = useMemo(() => {
    const map = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const key = `${d.getDate()}/${d.getMonth()+1}`;
      map[key] = { name: key, monto: 0 };
    }
    sales.forEach(s => {
      const d = parseDate(s);
      if (!d) return;
      const now2 = new Date(); now2.setHours(23,59,59);
      const cut = new Date(now2); cut.setDate(cut.getDate()-30);
      if (d < cut) return;
      const key = `${d.getDate()}/${d.getMonth()+1}`;
      if (map[key]) map[key].monto += s.total||0;
    });
    return Object.values(map);
  }, [sales]);

  // ── Mejor día/hora ────────────────────────────────────────────────────────
  const bestDow  = [...byDow].sort((a,b) => b.monto - a.monto)[0];
  const bestSlot = [...bySlot].sort((a,b) => b.monto - a.monto)[0];
  const bestDowFull = FULL_DAY_NAMES[DAY_NAMES.indexOf(bestDow?.name)];

  // ── Métodos de pago ───────────────────────────────────────────────────────
  const methodsMap = useMemo(() => {
    const acc = {};
    filtered.forEach(s => { const k = s.method||"Desconocido"; acc[k] = (acc[k]||0) + (s.total||0); });
    return acc;
  }, [filtered]);
  const methodsArr = Object.entries(methodsMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);
  const totalMethodsMoney = methodsArr.reduce((s, m) => s + m.value, 0);
  const bestMethod = methodsArr[0];

  // ── Productos ─────────────────────────────────────────────────────────────
  const productStats = useMemo(() => {
    const acc = {};
    filtered.forEach(s => (s.items||[]).forEach(it => {
      const k = it.id || it.name;
      if (!acc[k]) acc[k] = { name: it.name, qty: 0, revenue: 0 };
      acc[k].qty     += it.qty     || 0;
      acc[k].revenue += (it.price||0) * (it.qty||0);
    }));
    return Object.values(acc);
  }, [filtered]);
  const top5qty     = [...productStats].sort((a,b) => b.qty     - a.qty    ).slice(0,5);
  const top5rev     = [...productStats].sort((a,b) => b.revenue - a.revenue).slice(0,5);
  const starProduct = top5rev[0];

  // Sin movimiento 30 días
  const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate()-30); thirtyAgo.setHours(0,0,0,0);
  const activeIds = new Set(
    sales.filter(s => { const d = parseDate(s); return d && d >= thirtyAgo; })
         .flatMap(s => (s.items||[]).map(i => i.id || i.name))
  );
  const noMovement = products.filter(p => !activeIds.has(p.id) && !activeIds.has(p.name));

  // ── Inventario ────────────────────────────────────────────────────────────
  const lowStock   = products.filter(p => p.stock > 0 && p.stock < 5);
  const outStock   = products.filter(p => p.stock <= 0);
  const critStock  = products.filter(p => p.stock > 0 && p.stock < (p.minStock ?? 6));
  const invValue   = products.reduce((s, p) => s + (p.price||0)*(p.stock||0), 0);

  // ── Delta badge ───────────────────────────────────────────────────────────
  const Delta = ({ curr, prev: p, money }) => {
    const v = pct(curr, p);
    if (v === null) return null;
    const cls = parseFloat(v) > 0 ? "up" : parseFloat(v) < 0 ? "down" : "flat";
    const arrow = parseFloat(v) > 0 ? "▲" : parseFloat(v) < 0 ? "▼" : "–";
    return <div className={`ri-kpi-delta ${cls}`}>{arrow} {v}% vs período anterior</div>;
  };

  const TABS = [
    { id:"dashboard", label:"📊 Dashboard" },
    { id:"ventas",    label:"📈 Ventas" },
    { id:"pagos",     label:"💳 Pagos" },
    { id:"productos", label:"🏆 Productos" },
    { id:"stock",     label:"📦 Stock" },
  ];

  const RANGES = [
    { id:"hoy",    label:"Hoy" },
    { id:"semana", label:"Semana" },
    { id:"mes",    label:"Mes" },
    { id:"año",    label:"Año" },
    { id:"custom", label:"📅" },
  ];

  return (
    <div className="content">
      <div className="ri-wrap">
        {/* ── Tabs ── */}
        <div className="ri-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`ri-tab${tab===t.id?" active":""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div className="ri-filter-bar">
          {RANGES.map(r => (
            <button key={r.id} className={`ri-fbtn${r.id==="custom"?" ri-fbtn-custom":""}${range===r.id?" active":""}`}
              onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
        </div>
        {range === "custom" && (
          <div className="ri-custom-dates">
            <input type="date" value={customFrom} onChange={e => setFrom(e.target.value)} />
            <span style={{ color:"#6b7280", fontSize:11 }}>→</span>
            <input type="date" value={customTo}   onChange={e => setTo(e.target.value)} />
          </div>
        )}

        <div className="ri-scroll">

          {/* ════════════════ DASHBOARD ════════════════ */}
          {tab === "dashboard" && (<>
            <div className="ri-kpi-grid">
              <div className="ri-kpi">
                <div className="ri-kpi-label">Ventas totales</div>
                <div className="ri-kpi-value" style={{ color:"#00c896", fontSize:15 }}>{fmt(totalRev)}</div>
                <Delta curr={totalRev} prev={prevRev} money />
              </div>
              <div className="ri-kpi">
                <div className="ri-kpi-label">Transacciones</div>
                <div className="ri-kpi-value" style={{ color:"#60a5fa" }}>{txCount}</div>
                <Delta curr={txCount} prev={prevTx} />
              </div>
              <div className="ri-kpi">
                <div className="ri-kpi-label">Ticket promedio</div>
                <div className="ri-kpi-value" style={{ color:"#fb923c", fontSize:14 }}>{fmt(avgTicket)}</div>
                <Delta curr={avgTicket} prev={prevAvg} money />
              </div>
              <div className="ri-kpi">
                <div className="ri-kpi-label">Artículos vendidos</div>
                <div className="ri-kpi-value" style={{ color:"#a78bfa" }}>{totalItems.toFixed(0)}</div>
              </div>
            </div>

            {starProduct && (
              <div className="ri-star-card">
                <h3>⭐ Producto estrella del período</h3>
                <div className="ri-star-name">{starProduct.name}</div>
                <div className="ri-star-val">{fmt(starProduct.revenue)} · {starProduct.qty} unidades</div>
              </div>
            )}

            <div className="ri-card">
              <h3>📈 Tendencia — últimos 30 días</h3>
              <div className="ri-chart-wrap">
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={trend30} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3045" />
                    <XAxis dataKey="name" tick={{ fill:"#6b7280", fontSize:9 }} interval={6} />
                    <YAxis tick={{ fill:"#6b7280", fontSize:9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<RiTooltip money />} />
                    <Line type="monotone" dataKey="monto" stroke="#00c896" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ri-card">
              <h3>💳 Métodos de pago</h3>
              {methodsArr.length === 0
                ? <div className="ri-empty">Sin ventas en el período</div>
                : methodsArr.map((m, i) => (
                  <div key={m.name} className="ri-methods-row">
                    <div className="ri-methods-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <div className="ri-methods-name">{m.name}</div>
                    <div className="ri-methods-pct">{totalMethodsMoney > 0 ? ((m.value/totalMethodsMoney)*100).toFixed(0) : 0}%</div>
                    <div className="ri-methods-val">{fmt(m.value)}</div>
                  </div>
                ))
              }
            </div>

            <div className="ri-card">
              <h3>⚠️ Stock bajo (&lt; 5 unidades)</h3>
              {lowStock.length === 0
                ? <div className="ri-empty">✓ Todo el stock está bien</div>
                : lowStock.slice(0,5).map(p => (
                  <div key={p.id} className="ri-item">
                    <div className="ri-item-name">{p.name}</div>
                    <span className="ri-badge danger">{p.stock} {p.unit||"uds"}</span>
                  </div>
                ))
              }
            </div>
          </>)}

          {/* ════════════════ VENTAS ════════════════ */}
          {tab === "ventas" && (<>
            <div className="ri-kpi-grid">
              <div className="ri-kpi">
                <div className="ri-kpi-label">Total período</div>
                <div className="ri-kpi-value" style={{ color:"#00c896", fontSize:14 }}>{fmt(totalRev)}</div>
                <Delta curr={totalRev} prev={prevRev} money />
              </div>
              <div className="ri-kpi">
                <div className="ri-kpi-label">Transacciones</div>
                <div className="ri-kpi-value" style={{ color:"#60a5fa" }}>{txCount}</div>
              </div>
            </div>

            <div className="ri-card">
              <h3>📅 Ventas por día de la semana</h3>
              <div className="ri-chart-wrap">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={byDow} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3045" />
                    <XAxis dataKey="name" tick={{ fill:"#9ca3af", fontSize:10 }} />
                    <YAxis tick={{ fill:"#6b7280", fontSize:9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<RiTooltip money />} />
                    <Bar dataKey="monto" fill="#00c896" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {bestDow?.monto > 0 && (
                <div style={{ marginTop:8 }}>
                  <span className="ri-badge">🏆 Mejor día: {bestDowFull} — {fmt(bestDow.monto)}</span>
                </div>
              )}
            </div>

            <div className="ri-card">
              <h3>🕐 Ventas por franja horaria</h3>
              <div className="ri-chart-wrap">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={bySlot} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3045" />
                    <XAxis dataKey="name" tick={{ fill:"#9ca3af", fontSize:9 }} />
                    <YAxis tick={{ fill:"#6b7280", fontSize:9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<RiTooltip money />} />
                    <Bar dataKey="monto" fill="#60a5fa" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {bestSlot?.monto > 0 && (
                <div style={{ marginTop:8 }}>
                  <span className="ri-badge">⏰ Mejor franja: {bestSlot.name.split("\n")[0]} — {fmt(bestSlot.monto)}</span>
                </div>
              )}
            </div>

            <div className="ri-card">
              <h3>📈 Tendencia — últimos 30 días</h3>
              <div className="ri-chart-wrap">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trend30} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3045" />
                    <XAxis dataKey="name" tick={{ fill:"#6b7280", fontSize:9 }} interval={6} />
                    <YAxis tick={{ fill:"#6b7280", fontSize:9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<RiTooltip money />} />
                    <Line type="monotone" dataKey="monto" stroke="#00c896" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>)}

          {/* ════════════════ PAGOS ════════════════ */}
          {tab === "pagos" && (<>
            {methodsArr.length === 0
              ? <div className="ri-card"><div className="ri-empty">Sin ventas en el período seleccionado</div></div>
              : (<>
                <div className="ri-card">
                  <h3>🥧 Distribución por método</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={methodsArr} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={{ stroke:"#3a4158" }}
                      >
                        {methodsArr.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ background:"#1e2438", border:"1px solid #3a4158", borderRadius:8, fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="ri-card">
                  <h3>💰 Monto por método</h3>
                  {methodsArr.map((m, i) => (
                    <div key={m.name} className="ri-item">
                      <div className="ri-methods-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length], width:12, height:12, borderRadius:"50%", flexShrink:0 }} />
                      <div className="ri-item-name">{m.name}</div>
                      <div style={{ fontSize:10, color:"#6b7280", marginRight:6 }}>
                        {totalMethodsMoney > 0 ? ((m.value/totalMethodsMoney)*100).toFixed(1) : 0}%
                      </div>
                      <div className="ri-item-val">{fmt(m.value)}</div>
                    </div>
                  ))}
                </div>

                {bestMethod && (
                  <div className="ri-star-card">
                    <h3>⭐ Método más usado del período</h3>
                    <div className="ri-star-name">{bestMethod.name}</div>
                    <div className="ri-star-val">{fmt(bestMethod.value)} · {totalMethodsMoney > 0 ? ((bestMethod.value/totalMethodsMoney)*100).toFixed(1) : 0}% del total</div>
                  </div>
                )}
              </>)
            }
          </>)}

          {/* ════════════════ PRODUCTOS ════════════════ */}
          {tab === "productos" && (<>
            <div className="ri-card">
              <h3>🏆 Top 5 por cantidad vendida</h3>
              {top5qty.length === 0
                ? <div className="ri-empty">Sin ventas en el período</div>
                : top5qty.map((p, i) => {
                  const max = top5qty[0].qty || 1;
                  return (
                    <div key={p.name} className="ri-item" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                      <div style={{ display:"flex", width:"100%", alignItems:"center", gap:8 }}>
                        <div className="ri-item-rank" style={{ color: i===0?"#fbbf24": i===1?"#9ca3af": i===2?"#fb923c":"#6b7280" }}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}
                        </div>
                        <div className="ri-item-name">{p.name}</div>
                        <div className="ri-item-val">{p.qty} uds</div>
                      </div>
                      <div style={{ width:"100%", paddingLeft:28 }}>
                        <div className="ri-item-bar"><div className="ri-item-bar-fill" style={{ width:`${(p.qty/max)*100}%` }} /></div>
                      </div>
                    </div>
                  );
                })
              }
            </div>

            <div className="ri-card">
              <h3>💵 Top 5 por monto generado</h3>
              {top5rev.length === 0
                ? <div className="ri-empty">Sin ventas en el período</div>
                : top5rev.map((p, i) => {
                  const max = top5rev[0].revenue || 1;
                  return (
                    <div key={p.name} className="ri-item" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                      <div style={{ display:"flex", width:"100%", alignItems:"center", gap:8 }}>
                        <div className="ri-item-rank" style={{ color: i===0?"#fbbf24": i===1?"#9ca3af": i===2?"#fb923c":"#6b7280" }}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}
                        </div>
                        <div className="ri-item-name">{p.name}</div>
                        <div className="ri-item-val" style={{ fontSize:11 }}>{fmt(p.revenue)}</div>
                      </div>
                      <div style={{ width:"100%", paddingLeft:28 }}>
                        <div className="ri-item-bar"><div className="ri-item-bar-fill" style={{ width:`${(p.revenue/max)*100}%`, background:"linear-gradient(90deg,#60a5fa,#3b82f6)" }} /></div>
                      </div>
                    </div>
                  );
                })
              }
            </div>

            {starProduct && (
              <div className="ri-star-card">
                <h3>⭐ Producto estrella del período</h3>
                <div className="ri-star-name">{starProduct.name}</div>
                <div className="ri-star-val">{fmt(starProduct.revenue)} · {starProduct.qty} unidades</div>
              </div>
            )}

            <div className="ri-card">
              <h3>😴 Sin movimiento — últimos 30 días</h3>
              {noMovement.length === 0
                ? <div className="ri-empty">✓ Todos los productos tuvieron actividad</div>
                : noMovement.map(p => (
                  <div key={p.id} className="ri-item">
                    <div className="ri-item-name">{p.name}</div>
                    <span className="ri-badge warn">Stock: {p.stock}</span>
                  </div>
                ))
              }
            </div>
          </>)}

          {/* ════════════════ STOCK ════════════════ */}
          {tab === "stock" && (<>
            <div className="ri-kpi-grid">
              <div className="ri-kpi">
                <div className="ri-kpi-label">Valor inventario</div>
                <div className="ri-kpi-value" style={{ color:"#00c896", fontSize:13 }}>{fmt(invValue)}</div>
              </div>
              <div className="ri-kpi">
                <div className="ri-kpi-label">Total productos</div>
                <div className="ri-kpi-value" style={{ color:"#60a5fa" }}>{products.length}</div>
              </div>
              <div className="ri-kpi">
                <div className="ri-kpi-label">Stock bajo</div>
                <div className="ri-kpi-value" style={{ color: lowStock.length > 0 ? "#fb923c":"#6b7280" }}>{lowStock.length}</div>
              </div>
              <div className="ri-kpi">
                <div className="ri-kpi-label">Sin stock</div>
                <div className="ri-kpi-value" style={{ color: outStock.length > 0 ? "#ff6b6b":"#6b7280" }}>{outStock.length}</div>
              </div>
            </div>

            <div className="ri-card">
              <h3>🔴 Sin stock</h3>
              {outStock.length === 0
                ? <div className="ri-empty">✓ No hay productos sin stock</div>
                : outStock.map(p => (
                  <div key={p.id} className="ri-item">
                    <div className="ri-item-name">{p.name}</div>
                    <span className="ri-badge danger">Sin stock</span>
                  </div>
                ))
              }
            </div>

            <div className="ri-card">
              <h3>⚠️ Stock bajo (&lt; 5 unidades)</h3>
              {lowStock.length === 0
                ? <div className="ri-empty">✓ Todo bien</div>
                : lowStock.sort((a,b) => a.stock - b.stock).map(p => (
                  <div key={p.id} className="ri-item">
                    <div style={{ flex:1 }}>
                      <div className="ri-item-name">{p.name}</div>
                      <div className="ri-item-sub">{p.category||""}</div>
                    </div>
                    <span className="ri-badge danger">{p.stock} {p.unit||"uds"}</span>
                  </div>
                ))
              }
            </div>

            <div className="ri-card">
              <h3>🟡 Próximos a agotarse (bajo mínimo)</h3>
              {critStock.filter(p => p.stock >= 5).length === 0
                ? <div className="ri-empty">✓ Sin alertas</div>
                : critStock.filter(p => p.stock >= 5).sort((a,b) => a.stock - b.stock).map(p => (
                  <div key={p.id} className="ri-item">
                    <div style={{ flex:1 }}>
                      <div className="ri-item-name">{p.name}</div>
                      <div className="ri-item-sub">Mínimo: {p.minStock ?? 6}</div>
                    </div>
                    <span className="ri-badge warn">{p.stock} {p.unit||"uds"}</span>
                  </div>
                ))
              }
            </div>

            <div className="ri-card">
              <h3>📦 Todo el inventario</h3>
              {products.length === 0
                ? <div className="ri-empty">Sin productos</div>
                : [...products].sort((a,b) => a.stock - b.stock).map(p => (
                  <div key={p.id} className="ri-item">
                    <div style={{ flex:1 }}>
                      <div className="ri-item-name">{p.name}</div>
                      <div className="ri-item-sub">{p.category||""} · {fmt(p.price)}</div>
                    </div>
                    <span className={`ri-badge${p.stock<=0?" danger":p.stock<5?" warn":""}`}>
                      {p.stock} {p.unit||"uds"}
                    </span>
                  </div>
                ))
              }
            </div>
          </>)}

        </div>{/* ri-scroll */}
      </div>{/* ri-wrap */}
    </div>
  );
}

// ─── PermissionsView ──────────────────────────────────────────────────────────
function MigrationSection() {
  // ── Sección 1: migrar raíz → local1 ──────────────────────────────────────
  const [status, setStatus] = useState("idle"); // idle | checking | running | done | error | empty
  const [counts, setCounts] = useState(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  // ── Sección 2: copiar catálogo local1 → godoy-cruz ───────────────────────
  const [gcStatus, setGcStatus]     = useState("idle"); // idle | checking | running | done | error | empty
  const [gcCount, setGcCount]       = useState(null);
  const [gcProgress, setGcProgress] = useState("");
  const [gcError, setGcError]       = useState("");

  const check = async () => {
    setStatus("checking");
    try {
      const [pSnap, sSnap, cSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "sales")),
        getDoc(doc(db, "settings", "categories")),
      ]);
      setCounts({ products: pSnap.size, sales: sSnap.size, hasCategories: cSnap.exists() });
      setStatus(pSnap.size === 0 && sSnap.size === 0 ? "empty" : "ready");
    } catch (e) { setError(e.message); setStatus("error"); }
  };

  const migrate = async () => {
    setStatus("running"); setError("");
    try {
      setProgress("Leyendo productos…");
      const pSnap = await getDocs(collection(db, "products"));
      let done = 0;
      for (const d of pSnap.docs) {
        await setDoc(doc(db, "locals", "local1", "products", d.id), d.data());
        setProgress(`Productos: ${++done}/${pSnap.size}`);
      }
      setProgress("Leyendo ventas…");
      const sSnap = await getDocs(collection(db, "sales"));
      done = 0;
      for (const d of sSnap.docs) {
        await setDoc(doc(db, "locals", "local1", "sales", d.id), d.data());
        setProgress(`Ventas: ${++done}/${sSnap.size}`);
      }
      setProgress("Copiando categorías…");
      const cSnap = await getDoc(doc(db, "settings", "categories"));
      if (cSnap.exists()) await setDoc(doc(db, "locals", "local1", "settings", "categories"), cSnap.data());
      setProgress(`✅ Listo: ${pSnap.size} productos y ${sSnap.size} ventas migradas a Local 1`);
      setStatus("done");
    } catch (e) { setError(e.message); setStatus("error"); }
  };

  const checkGodoy = async () => {
    setGcStatus("checking");
    try {
      const snap = await getDocs(collection(db, "locals", "local1", "products"));
      setGcCount(snap.size);
      setGcStatus(snap.size === 0 ? "empty" : "ready");
    } catch (e) { setGcError(e.message); setGcStatus("error"); }
  };

  const copyToGodoy = async () => {
    setGcStatus("running"); setGcError("");
    try {
      const snap = await getDocs(collection(db, "locals", "local1", "products"));
      let done = 0;
      for (const d of snap.docs) {
        const src = d.data();
        await setDoc(doc(db, "locals", "local-godoy-cruz", "products", d.id), {
          name:     src.name     || "",
          barcode:  src.barcode  || null,
          img:      src.img      || null,
          category: src.category || "General",
          type:     src.type     || "unit",
          unit:     src.unit     || "u",
          price:    0,
          stock:    0,
          minStock: 5,
          cost:     0,
        });
        setGcProgress(`Copiando: ${++done}/${snap.size}`);
      }
      setGcProgress(`✅ ${snap.size} productos copiados a Godoy Cruz (sin precio ni stock)`);
      setGcStatus("done");
    } catch (e) { setGcError(e.message); setGcStatus("error"); }
  };

  const card = (border) => ({ background: "#1e2438", border: `1px solid ${border}`, borderRadius: 10, padding: 16, marginBottom: 14 });
  const info = { background: "#252b3b", borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 10 };
  const running = { background: "#252b3b", borderRadius: 8, padding: 10, fontSize: 13, color: "#00c896", textAlign: "center" };
  const done = { background: "#0d2b1e", border: "1px solid #00c896", borderRadius: 8, padding: 10, fontSize: 13, color: "#00c896" };
  const err = { background: "#3b0d0d", border: "1px solid #ff6b6b", borderRadius: 8, padding: 10, fontSize: 13, color: "#ff6b6b" };

  return (
    <>
      {/* ── Tarjeta 1: migración raíz → local1 ── */}
      <div style={card("#00c89644")}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🔄</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#e8eaf0" }}>Migración de datos al formato multi-local</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Copia productos, ventas y categorías de la ruta raíz hacia <code style={{ background: "#252b3b", padding: "1px 4px", borderRadius: 3 }}>locals/local1/</code></div>
          </div>
        </div>
        {status === "idle"     && <button onClick={check} className="btn-primary" style={{ width: "100%" }}>Verificar datos a migrar</button>}
        {status === "checking" && <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "8px 0" }}>⏳ Verificando…</div>}
        {status === "empty"    && <div style={{ ...info, textAlign: "center", color: "#9ca3af" }}>✓ No hay datos en la ruta raíz para migrar.</div>}
        {status === "ready" && counts && (
          <>
            <div style={info}>
              <div>📦 <strong>{counts.products}</strong> productos · 🧾 <strong>{counts.sales}</strong> ventas · 🏷️ Categorías: <strong>{counts.hasCategories ? "sí" : "no"}</strong></div>
            </div>
            <button onClick={migrate} className="btn-primary" style={{ width: "100%", background: "#00a87a" }}>▶ Migrar todo a Local 1</button>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, textAlign: "center" }}>Los datos originales no serán borrados.</div>
          </>
        )}
        {status === "running"  && <div style={running}>⏳ {progress}</div>}
        {status === "done"     && <div style={done}>{progress}</div>}
        {status === "error"    && <div style={err}>❌ {error}</div>}
      </div>

      {/* ── Tarjeta 2: copiar catálogo local1 → godoy-cruz ── */}
      <div style={card("#60a5fa44")}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#e8eaf0" }}>Copiar catálogo a Godoy Cruz</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Copia productos de Local 1 a Godoy Cruz con <strong style={{ color: "#c9cdd6" }}>foto, código y descripción</strong> únicamente — precio, stock y costo quedan en cero para completar localmente.</div>
          </div>
        </div>
        {gcStatus === "idle"     && <button onClick={checkGodoy} className="btn-primary" style={{ width: "100%", background: "#2563eb" }}>Verificar productos en Local 1</button>}
        {gcStatus === "checking" && <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "8px 0" }}>⏳ Verificando…</div>}
        {gcStatus === "empty"    && <div style={{ ...info, textAlign: "center", color: "#9ca3af" }}>⚠️ Local 1 no tiene productos todavía. Migrá primero desde la tarjeta de arriba.</div>}
        {gcStatus === "ready"    && (
          <>
            <div style={info}>📦 <strong>{gcCount}</strong> productos en Local 1 para copiar</div>
            <button onClick={copyToGodoy} className="btn-primary" style={{ width: "100%", background: "#2563eb" }}>▶ Copiar catálogo a Godoy Cruz</button>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, textAlign: "center" }}>Los productos de Local 1 no se modifican. Si ya existe un producto en Godoy Cruz, se sobreescribe.</div>
          </>
        )}
        {gcStatus === "running"  && <div style={running}>⏳ {gcProgress}</div>}
        {gcStatus === "done"     && <div style={done}>{gcProgress}</div>}
        {gcStatus === "error"    && <div style={err}>❌ {gcError}</div>}
      </div>
    </>
  );
}

function PermissionsView() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const togglePerm = async (userId, perm, current) => {
    await updateDoc(doc(db, "users", userId), { [`permissions.${perm}`]: !current });
  };

  const assignLocal = async (userId, localId) => {
    await updateDoc(doc(db, "users", userId), { localId });
  };

  const perms = [
    { key: "sell", label: "Registrar ventas" },
    { key: "viewInventory", label: "Ver inventario" },
    { key: "editInventory", label: "Editar inventario" },
    { key: "viewReports", label: "Ver reportes" },
  ];

  return (
    <div className="content">
      <div className="perm-area">
        <MigrationSection />
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>Controlá los permisos de cada colaborador</div>
        {users.filter(u => u.role !== "owner").map(u => (
          <div key={u.id} className="perm-card">
            <div className="perm-email">👤 {u.name || u.email}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{u.email}</div>
            <div className="perm-toggle" style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>🏪 Local asignado</span>
              <select
                value={u.localId || "local1"}
                onChange={e => assignLocal(u.id, e.target.value)}
                style={{ background: "#252b3b", border: "1px solid #3a4158", borderRadius: 6, color: "#e8eaf0", padding: "4px 8px", fontSize: 12, cursor: "pointer" }}
              >
                {LOCALS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            {perms.map(p => (
              <div key={p.key} className="perm-toggle">
                <span>{p.label}</span>
                <div className={`toggle-switch${u.permissions?.[p.key] ? " on" : ""}`} onClick={() => togglePerm(u.id, p.key, u.permissions?.[p.key])}>
                  <div className="toggle-knob" />
                </div>
              </div>
            ))}
          </div>
        ))}
        {users.filter(u => u.role !== "owner").length === 0 && <div style={{ color: "#6b7280", textAlign: "center", padding: 40, fontSize: 13 }}>Aún no hay colaboradores registrados</div>}
      </div>
    </div>
  );
}

// ─── LocationCard ─────────────────────────────────────────────────────────────
function LocationCard({ loc, onChange, onDelete }) {
  const [name, setName] = useState(loc.name);
  const [ip,   setIp]   = useState(loc.ip);
  const [testSt, setTestSt]   = useState("idle");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => { setName(loc.name); }, [loc.name]);
  useEffect(() => { setIp(loc.ip); },   [loc.ip]);

  const runFetch = async (fn) => {
    setTestSt("testing"); setTestMsg("");
    try { await fn(); }
    catch (err) {
      setTestSt("error");
      setTestMsg(err.name === "AbortError"
        ? "Sin respuesta."
        : err.message?.includes("fetch") || err.message?.includes("Failed")
          ? `No conecta a ${ip}.`
          : err.message || "Error");
    }
  };

  const testPing = () => runFetch(async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(ip + "/ping", { method: "GET", signal: ctrl.signal }).catch(() => null);
    clearTimeout(t);
    if (!res) { const e = new Error("Sin respuesta"); e.name = "AbortError"; throw e; }
    setTestSt("ok"); setTestMsg(res.ok ? "Servidor alcanzable." : `Responde HTTP ${res.status}.`);
  });

  const testPrint = () => runFetch(async () => {
    const fake = { id: "TEST0001", total: 1000, method: "Efectivo", received: 1000, change: 0, items: [{ name: "Producto prueba", qty: 1, price: 1000 }] };
    const b64 = buildEscPos(fake, name.toUpperCase());
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${ip}/imprimir`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket: b64 }), signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setTestSt("ok"); setTestMsg("Ticket de prueba impreso.");
  });

  return (
    <div className="location-card">
      <div className="location-card-header">
        <span style={{ fontSize: 16 }}>📍</span>
        <input className="location-name-input" value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => { if (name.trim() && name !== loc.name) onChange("name", name.trim()); }}
          placeholder="Nombre de la ubicación" />
        <button className="location-del-btn" onClick={() => {
          if (window.confirm(`¿Eliminar "${name}"?`)) onDelete();
        }} title="Eliminar ubicación">🗑️</button>
      </div>
      <input className="modal-input" value={ip}
        onChange={e => setIp(e.target.value)}
        onBlur={() => { if (ip.trim() && ip !== loc.ip) onChange("ip", ip.trim()); }}
        placeholder="http://10.0.0.100:3000" />
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button className="btn-secondary"
          style={{ flex: 1, fontSize: 12, padding: "6px 4px", opacity: testSt === "testing" ? 0.6 : 1 }}
          onClick={testPing} disabled={testSt === "testing"}>
          {testSt === "testing" ? "..." : "🔌 Ping"}
        </button>
        <button className="btn-secondary"
          style={{ flex: 1, fontSize: 12, padding: "6px 4px", opacity: testSt === "testing" ? 0.6 : 1 }}
          onClick={testPrint} disabled={testSt === "testing"}>
          🖨️ Prueba
        </button>
      </div>
      {testSt === "ok"    && <div className="print-ok">✅ {testMsg}</div>}
      {testSt === "error" && <div className="print-err">❌ {testMsg}</div>}
    </div>
  );
}

// ─── SettingsView ─────────────────────────────────────────────────────────────
const PRINTER_DEFAULT_LOCS = [
  { id: "casa",   name: "Casa",       ip: "http://10.0.0.100:3000" },
  { id: "local1", name: "Local 1",    ip: "http://10.0.0.101:3000" },
  { id: "godoy",  name: "Godoy Cruz", ip: "http://10.0.0.102:3000" },
];

function SettingsView({ userProfile }) {
  const uid = userProfile?.id;
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving,  setSaving]      = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [newName, setNewName]     = useState("");
  const [newIp,   setNewIp]       = useState("http://");
  const saveRef = useRef(null);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid, "settings", "printer"), (snap) => {
      if (snap.exists()) {
        setLocations(snap.data().locations || []);
      } else {
        setDoc(doc(db, "users", uid, "settings", "printer"), { locations: PRINTER_DEFAULT_LOCS });
        setLocations(PRINTER_DEFAULT_LOCS);
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const persist = async (locs) => {
    if (!uid) return;
    setSaving(true);
    try { await setDoc(doc(db, "users", uid, "settings", "printer"), { locations: locs }); }
    finally { setSaving(false); }
  };

  const debouncedPersist = (locs) => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => persist(locs), 700);
  };

  const updateLoc = (id, field, value) => {
    const updated = locations.map(l => l.id === id ? { ...l, [field]: value } : l);
    setLocations(updated);
    debouncedPersist(updated);
  };

  const deleteLoc = (id) => {
    const updated = locations.filter(l => l.id !== id);
    setLocations(updated);
    persist(updated);
  };

  const addLoc = async () => {
    if (!newName.trim() || !newIp.trim()) return;
    const newLoc = { id: Date.now().toString(36), name: newName.trim(), ip: newIp.trim() };
    const updated = [...locations, newLoc];
    setLocations(updated);
    await persist(updated);
    setNewName(""); setNewIp("http://"); setShowAdd(false);
  };

  return (
    <div className="content" style={{ overflowY: "auto" }}>
      <div className="settings-area">
        <div className="settings-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="settings-section-title" style={{ marginBottom: 0 }}>🖨️ Ubicaciones de impresora</div>
            {saving && <span style={{ fontSize: 11, color: "#6b7280" }}>Guardando…</span>}
          </div>

          {loading ? (
            <div style={{ color: "#6b7280", textAlign: "center", padding: 20, fontSize: 13 }}>Cargando…</div>
          ) : (
            <>
              {locations.length === 0 && !showAdd && (
                <div style={{ color: "#6b7280", textAlign: "center", padding: "20px 0", fontSize: 13 }}>
                  No hay ubicaciones. Agregá una para imprimir por WiFi.
                </div>
              )}

              {locations.map(loc => (
                <LocationCard key={loc.id} loc={loc}
                  onChange={(field, value) => updateLoc(loc.id, field, value)}
                  onDelete={() => deleteLoc(loc.id)} />
              ))}

              {showAdd ? (
                <div className="location-add-form">
                  <div className="modal-label">Nombre de la ubicación</div>
                  <input className="modal-input" value={newName} autoFocus
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addLoc()}
                    placeholder="Casa, Depósito, Oficina…" />
                  <div className="modal-label" style={{ marginTop: 10 }}>IP del servidor</div>
                  <input className="modal-input" value={newIp}
                    onChange={e => setNewIp(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addLoc()}
                    placeholder="http://192.168.1.50:3000" />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={addLoc}
                      disabled={!newName.trim() || !newIp.trim()}>Guardar</button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => {
                      setShowAdd(false); setNewName(""); setNewIp("http://");
                    }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button className="btn-secondary" style={{ width: "100%", marginTop: 4 }}
                  onClick={() => setShowAdd(true)}>
                  ＋ Nueva ubicación
                </button>
              )}
            </>
          )}
        </div>

        <div className="settings-section">
          <div className="settings-section-title">ℹ️ Cómo funciona</div>
          <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7 }}>
            Cada ubicación tiene su propia IP. Al imprimir podés elegir desde qué ubicación enviarlo.<br /><br />
            <strong style={{ color: "#e8eaf0" }}>WiFi:</strong> el servidor debe aceptar{" "}
            <code style={{ background: "#252b3b", padding: "1px 5px", borderRadius: 3 }}>POST /imprimir</code>{" "}
            con <code style={{ background: "#252b3b", padding: "1px 5px", borderRadius: 3 }}>{`{"ticket":"base64"}`}</code>.<br /><br />
            <strong style={{ color: "#e8eaf0" }}>Bluetooth:</strong> imprime directo sin servidor (Chrome Android/Desktop).
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
// ─── DocsView ─────────────────────────────────────────────────────────────────
const DOC_TYPES = ["Boleta", "Remito", "Recibo", "Otro"];

// Comprime imagen a JPEG 70%, máximo 1200px
async function compressImage(file) {
  if (!file.type.startsWith("image/")) return { blob: file, mime: file.type };
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve({ blob, mime: "image/jpeg" }), "image/jpeg", 0.7);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ blob: file, mime: file.type }); };
    img.src = url;
  });
}

// Traduce errores de Firebase Storage a mensajes en español
function storageErrMsg(err) {
  const code = err?.code || "";
  if (code.includes("unauthorized") || code.includes("permission") || err?.message?.includes("403"))
    return "Sin permisos de escritura en Storage. En Firebase Console → Storage → Reglas, permitir escritura a usuarios autenticados.";
  if (code.includes("canceled"))   return "Subida cancelada.";
  if (code.includes("quota"))      return "Cuota de almacenamiento superada.";
  if (err?.message === "timeout")  return "Tiempo agotado (30 s). Verificá la conexión.";
  if (code.includes("network") || err?.message?.includes("network") || err?.message?.includes("fetch"))
    return "Error de red. Verificá la conexión a internet.";
  return err?.message || "Error desconocido al subir.";
}

function DocsView({ userProfile }) {
  const localId = useContext(LocalCtx);

  // ── Documents list (Firestore) ─────────────────────────────────────────────
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    if (!localId) return;
    const q = query(collection(db, "locals", localId, "documents"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [localId]);

  // ── Multi-file upload ──────────────────────────────────────────────────────
  // items: [{ id, file, preview, status, error, analyzeStatus, analyzeResult }]
  const fileInputRef = useRef(null);
  const [items, setItems]     = useState([]);
  const [docType, setDocType] = useState("Boleta");
  const [docName, setDocName] = useState("");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState(null);

  const updateItem = (id, patch) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSummary(null);
    setDocName(files[0].name.replace(/\.[^.]+$/, ""));
    setDocDate(new Date().toISOString().split("T")[0]);
    setDocType("Boleta");
    setItems(files.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      status: "pending",
      error: null,
    })));
    e.target.value = "";
  };

  // Stream analysis from the API, save results to Firestore, update item state
  const analyzeDocHelper = async (itemId, docId, fileUrl, mimeType, docNameStr, docTypeStr, docDateStr) => {
    if (itemId) updateItem(itemId, { analyzeStatus: "analyzing" });
    const foundItems = [];
    let extractedDate = null;
    try {
      const res = await fetch("/api/analyze-boleta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fileUrl, mimeType, name: docNameStr, type: docTypeStr, date: docDateStr }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.item) foundItems.push({ barcode: data.item.barcode || "", name: data.item.name, price: data.item.price });
            if (data.done && data.doc_date) extractedDate = data.doc_date;
            if (data.error) throw new Error(data.error);
          } catch {}
        }
      }
      const analysis = {
        items: foundItems,
        extractedDate: extractedDate || docDateStr,
        itemsCount: foundItems.length,
        analyzedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "locals", localId, "documents", docId), {
        analysis,
        ...(extractedDate ? { date: extractedDate } : {}),
      });
      if (itemId) updateItem(itemId, {
        analyzeStatus: "done",
        analyzeResult: { date: extractedDate || docDateStr, itemsCount: foundItems.length },
      });
    } catch {
      if (itemId) updateItem(itemId, { analyzeStatus: "error" });
      // Don't rethrow — analysis failure doesn't invalidate the upload
    }
  };

  const uploadOne = async (item) => {
    updateItem(item.id, { status: "uploading" });
    try {
      const { blob, mime } = await compressImage(item.file);
      const ext = mime === "image/jpeg" ? "jpg" : (item.file.name.split(".").pop() || "bin");
      const path = `locals/${localId}/documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const sRef = ref(storage, path);

      const uploadTimeout = new Promise((_, rej) => setTimeout(() => rej({ message: "timeout" }), 30000));
      await Promise.race([uploadBytes(sRef, blob, { contentType: mime }), uploadTimeout]);
      const fileUrl = await getDownloadURL(sRef);

      await addDoc(collection(db, "locals", localId, "documents"), {
        type: docType,
        name: docName.trim() || item.file.name,
        date: docDate,
        fileUrl,
        fileName: item.file.name,
        mimeType: mime,
        uploadedBy: userProfile?.email || "",
        createdAt: serverTimestamp(),
      });
      updateItem(item.id, { status: "done" });
      return { ok: true };
    } catch (err) {
      const msg = storageErrMsg(err);
      updateItem(item.id, { status: "error", error: msg });
      return { ok: false, error: msg };
    }
  };

  const handleUploadAll = async () => {
    if (!items.length) return;
    setSummary(null);
    const results = await Promise.all(items.map(uploadOne));
    const ok     = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    const errors = [...new Set(results.filter(r => !r.ok).map(r => r.error))];
    setSummary({ ok, failed, errors });
    if (failed === 0) {
      setTimeout(() => { setItems([]); setSummary(null); }, 2000);
    }
  };

  // Re-analyze an existing saved document (manual button)
  const [reanalyzing, setReanalyzing] = useState({});
  const reanalyzeDoc = async (d) => {
    if (reanalyzing[d.id]) return;
    setReanalyzing(r => ({ ...r, [d.id]: true }));
    try {
      await analyzeDocHelper(null, d.id, d.fileUrl, d.mimeType, d.name, d.type, d.date);
    } finally {
      setReanalyzing(r => { const n = { ...r }; delete n[d.id]; return n; });
    }
  };

  const fmtDocDate = (d) => {
    if (!d) return "";
    const p = d.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}` : d;
  };

  const isUploading = items.some(it => it.status === "uploading");
  const hasModal    = items.length > 0;

  // ── AI Chat ────────────────────────────────────────────────────────────────
  const [chatMsgs, setChatMsgs]   = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy]   = useState(false);
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const handleChat = async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    setChatInput("");
    const history = [...chatMsgs, { role: "user", content: text }];
    setChatMsgs(history);
    setChatBusy(true);
    setChatMsgs(m => [...m, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/docs-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          documents: docs.map(d => ({ url: d.fileUrl, type: d.type, name: d.name, date: d.date, mimeType: d.mimeType })),
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) { reply += data.content; setChatMsgs(m => [...m.slice(0, -1), { role: "assistant", content: reply }]); }
            if (data.error)   { setChatMsgs(m => [...m.slice(0, -1), { role: "assistant", content: "Error: " + data.error }]); }
          } catch {}
        }
      }
    } catch {
      setChatMsgs(m => [...m.slice(0, -1), { role: "assistant", content: "Error al conectar con la IA." }]);
    } finally {
      setChatBusy(false);
    }
  };

  const statusIcon = (status) => {
    if (status === "uploading") return <span className="spin" style={{ fontSize: 18 }}>⏳</span>;
    if (status === "done")      return "✅";
    if (status === "error")     return "❌";
    return null;
  };

  return (
    <div className="docs-wrap">
      {/* ── Multi-file upload modal ────────────────────────────────────────── */}
      {hasModal && (
        <div className="modal-overlay" onClick={() => !isUploading && (setItems([]), setSummary(null))}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h2>📎 Subir {items.length} archivo{items.length !== 1 ? "s" : ""}</h2>

            {/* Thumbnails grid */}
            <div className="docs-upload-grid">
              {items.map(it => (
                <div key={it.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div className="docs-upload-thumb">
                    {it.preview
                      ? <img src={it.preview} alt="" />
                      : <div className="docs-upload-pdf-icon">
                          <span style={{ fontSize: 26 }}>📄</span>
                          <span className="docs-upload-fname">{it.file.name}</span>
                        </div>
                    }
                    {it.status !== "pending" && (
                      <div className={`docs-upload-overlay ${it.status}`}>
                        {statusIcon(it.status)}
                      </div>
                    )}
                    {it.preview && <div className="docs-upload-fname" style={{ position: "absolute", bottom: 2, left: 0, right: 0, background: "rgba(0,0,0,0.5)", padding: "1px 4px" }}>{it.file.name}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary banners */}
            {summary && summary.ok > 0 && summary.failed === 0 && (
              <div className="docs-ok-banner">✅ {summary.ok} archivo{summary.ok !== 1 ? "s" : ""} subido{summary.ok !== 1 ? "s" : ""} correctamente</div>
            )}
            {summary && summary.failed > 0 && (
              <div className="docs-err-banner">
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {summary.ok > 0 ? `✅ ${summary.ok} subido${summary.ok !== 1 ? "s" : ""} · ` : ""}
                  ❌ {summary.failed} con error
                </div>
                {summary.errors.map((e, i) => <div key={i} style={{ marginTop: 2 }}>• {e}</div>)}
              </div>
            )}

            {/* Shared form */}
            <div className="modal-section">
              <div className="modal-label">Tipo de documento</div>
              <select className="modal-input" value={docType} onChange={e => setDocType(e.target.value)} disabled={isUploading}>
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="modal-section">
              <div className="modal-label">Proveedor / Nombre <span style={{ color: "#6b7280" }}>(opcional)</span></div>
              <input className="modal-input" value={docName} onChange={e => setDocName(e.target.value)}
                placeholder="Ej: Distribuidora García" disabled={isUploading} />
            </div>
            <div className="modal-section">
              <div className="modal-label">Fecha</div>
              <input className="modal-input" type="date" value={docDate} onChange={e => setDocDate(e.target.value)} disabled={isUploading} />
            </div>

            <div className="modal-actions" style={{ marginTop: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }}
                onClick={() => { setItems([]); setSummary(null); }} disabled={isUploading}>
                Cancelar
              </button>
              <button className="btn-primary" style={{ flex: 2, opacity: isUploading ? 0.65 : 1 }}
                onClick={handleUploadAll} disabled={isUploading}>
                {isUploading
                  ? `Subiendo ${items.filter(i => i.status === "done" || i.status === "error").length}/${items.length}…`
                  : `Subir ${items.length} archivo${items.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="docs-header">
        <span style={{ fontSize: 13, color: "#9ca3af" }}>
          {docs.length === 0 ? "Sin documentos" : `${docs.length} documento${docs.length !== 1 ? "s" : ""}`}
        </span>
        <button className="btn-primary" style={{ fontSize: 13, padding: "7px 14px" }}
          onClick={() => fileInputRef.current?.click()}>
          + Subir
        </button>
        <input ref={fileInputRef} type="file" multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          style={{ display: "none" }} onChange={handleFileSelect} />
      </div>

      {/* ── Document list ─────────────────────────────────────────────────── */}
      <div className="docs-list">
        {docs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b7280", padding: "28px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sin documentos</div>
            <div style={{ fontSize: 12 }}>Subí boletas, remitos o recibos para que la IA los analice</div>
          </div>
        ) : docs.map(doc => (
          <div key={doc.id} className="doc-card">
            {doc.mimeType?.startsWith("image/")
              ? <img src={doc.fileUrl} alt="" className="doc-thumb" />
              : <div className="doc-thumb-pdf">📄</div>
            }
            <div className="doc-info">
              <div className="doc-type">{doc.type}</div>
              <div className="doc-name">{doc.name || doc.fileName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginTop: 2 }}>
                <span className="doc-date">{doc.analysis?.extractedDate || doc.date}</span>
                {doc.analysis && (
                  <span className="doc-analysis-chip">
                    {doc.analysis.itemsCount} prod · ${(doc.analysis.items?.[0]?.price ?? "—")}
                  </span>
                )}
              </div>
            </div>
            <button
              className="doc-reanalyze-btn"
              title="Re-analizar con IA"
              disabled={!!reanalyzing[doc.id]}
              onClick={() => reanalyzeDoc(doc)}>
              {reanalyzing[doc.id] ? <span className="spin">⏳</span> : "↺"}
            </button>
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: "#6b7280", fontSize: 20, textDecoration: "none", padding: "4px 6px", flexShrink: 0 }}>↗</a>
          </div>
        ))}
      </div>

      {/* ── AI Chat ───────────────────────────────────────────────────────── */}
      <div className="docs-chat">
        <div className="docs-chat-header">
          <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🤖 Chat — Preguntá sobre tus documentos
          </span>
        </div>
        <div className="docs-chat-msgs">
          {chatMsgs.length === 0 && (
            <div style={{ color: "#6b7280", fontSize: 12, fontStyle: "italic", padding: "6px 0" }}>
              Ej: "¿cuánto pagué por harina?" · "Mostrame boletas de mayo" · "¿Qué gasté en Distribuidora García?"
            </div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "doc-msg-user" : "doc-msg-ai"}>
              {m.content || (chatBusy && m.role === "assistant" ? "▌" : "")}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="docs-chat-input-row">
          <input className="modal-input" style={{ flex: 1, margin: 0 }}
            placeholder="Preguntá sobre los documentos..."
            value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleChat()}
            disabled={chatBusy} />
          <button className="btn-primary" style={{ padding: "8px 14px", flexShrink: 0 }}
            onClick={handleChat} disabled={chatBusy || !chatInput.trim()}>
            {chatBusy ? "▌" : "→"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [view, setView] = useState("sale");
  const [moreOpen, setMoreOpen] = useState(false);
  const [products, setProducts]     = useState([]);
  const [sales, setSales]           = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [categories, setCategories] = useState(CATEGORIES.filter(c => c !== "Todas"));
  const [activeLocal, setActiveLocal] = useState(() => localStorage.getItem("mi-pos-active-local") || "local1");
  const [localMenuOpen, setLocalMenuOpen] = useState(false);

  useEffect(() => {
    // Timeout fallback: if Firebase doesn't respond in 8s, stop loading
    const timeout = setTimeout(() => {
      setAuthLoading(false);
      setAuthError("No se pudo conectar con Firebase. Verificá que Authentication y Firestore estén habilitados en la consola de Firebase.");
    }, 8000);

    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (u) => {
        clearTimeout(timeout);
        try {
          setUser(u);
          if (u) {
            const { getDoc } = await import("firebase/firestore");
            const profileSnap = await getDoc(doc(db, "users", u.uid));
            if (profileSnap.exists()) {
              setUserProfile({ id: u.uid, ...profileSnap.data() });
            } else {
              const ownerData = { email: u.email, name: u.email, role: "owner", uid: u.uid, permissions: { sell: true, viewInventory: true, editInventory: true, viewReports: true }, createdAt: serverTimestamp() };
              await setDoc(doc(db, "users", u.uid), ownerData);
              setUserProfile({ id: u.uid, ...ownerData });
            }
          } else {
            setUserProfile(null);
          }
          setAuthError("");
        } catch (err) {
          console.error("[Auth] Error loading profile:", err);
          setAuthError("Error al cargar el perfil: " + (err.message || err));
          setUser(null);
        } finally {
          setAuthLoading(false);
        }
      }, (err) => {
        // onAuthStateChanged error callback
        clearTimeout(timeout);
        console.error("[Auth] onAuthStateChanged error:", err);
        let msg = "Error de autenticación.";
        if (err.code === "auth/configuration-not-found" || err.code === "auth/invalid-api-key") {
          msg = "Firebase Authentication no está habilitado. Activá Email/Password en la consola de Firebase.";
        }
        setAuthError(msg);
        setUser(null);
        setAuthLoading(false);
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error("[Auth] setup error:", err);
      setAuthError("Error al inicializar Firebase: " + (err.message || err));
      setAuthLoading(false);
    }

    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  // Derive the effective local: owner uses their selected local; collaborators use their assigned local
  const isOwnerEarly = userProfile?.role === "owner";
  const effectiveLocal = isOwnerEarly ? activeLocal : (userProfile?.localId || "local1");

  // Load products from Firestore
  useEffect(() => {
    if (!user || !effectiveLocal) return;
    setProducts([]);
    const unsub = onSnapshot(collection(db, "locals", effectiveLocal, "products"), async (snap) => {
      if (snap.empty && !initialized && effectiveLocal === "local1") {
        // Seed initial products only for local1 on first run
        for (const p of INITIAL_PRODUCTS) {
          const { id, ...data } = p;
          await setDoc(doc(db, "locals", effectiveLocal, "products", id), data);
        }
        setInitialized(true);
      } else {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setInitialized(true);
      }
    });
    return unsub;
  }, [user, effectiveLocal]);

  // Load sales
  useEffect(() => {
    if (!user || !effectiveLocal) return;
    setSales([]);
    const q = query(collection(db, "locals", effectiveLocal, "sales"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, snap => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user, effectiveLocal]);

  // Load categories from Firestore (real-time); seed defaults if first run
  useEffect(() => {
    if (!user || !effectiveLocal) return;
    const unsub = onSnapshot(doc(db, "locals", effectiveLocal, "settings", "categories"), (snap) => {
      if (snap.exists()) {
        setCategories(snap.data().list || []);
      } else {
        const defaults = CATEGORIES.filter(c => c !== "Todas");
        setDoc(doc(db, "locals", effectiveLocal, "settings", "categories"), { list: defaults });
        setCategories(defaults);
      }
    });
    return unsub;
  }, [user, effectiveLocal]);

  if (authLoading) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#1a1f2e", color: "#00c896", gap: 12 }}>
      <div style={{ fontSize: 36 }}>🛒</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>Conectando con Firebase…</div>
    </div>
  );
  if (!user) return <><style>{css}</style><LoginScreen firebaseError={authError} /></>;

  const isOwner = userProfile?.role === "owner";
  const perms = userProfile?.permissions || {};

  const canUseAI = isOwner || perms.sell || perms.viewReports || perms.viewInventory;
  const activeLocalName = LOCALS.find(l => l.id === effectiveLocal)?.name || effectiveLocal;

  const navItems = [
    { id: "sale",      icon: "🛒", label: "Venta",      show: perms.sell || isOwner },
    { id: "inventory", icon: "📦", label: "Inventario", show: perms.viewInventory || isOwner },
    { id: "history",   icon: "📋", label: "Historial",  show: isOwner },
    { id: "perms",     icon: "👥", label: "Equipo",     show: isOwner },
  ].filter(n => n.show);

  const moreItems = [
    { id: "reports",  icon: "📊", label: "Reportes",     show: perms.viewReports || isOwner },
    { id: "ai",       icon: "🤖", label: "Asistente IA", show: canUseAI },
    { id: "docs",     icon: "📄", label: "Documentos",   show: true },
    { id: "settings", icon: "⚙️", label: "Ajustes",      show: isOwner },
  ].filter(n => n.show);

  const titles = { sale: "Mi POS 2", inventory: "Inventario", history: "Historial", reports: "Reportes", perms: "Mi Equipo", ai: "Asistente IA", docs: "Documentos", settings: "Ajustes" };

  const goTo = (id) => { setView(id); setMoreOpen(false); };

  const switchLocal = (id) => {
    setActiveLocal(id);
    localStorage.setItem("mi-pos-active-local", id);
    setLocalMenuOpen(false);
    setInitialized(false);
  };

  return (
    <LocalCtx.Provider value={effectiveLocal}>
      <style>{css}</style>
      <div className="app" onClick={() => localMenuOpen && setLocalMenuOpen(false)}>
        <div className="top-header">
          <div className="logo">PV</div>
          <h1>{titles[view]}</h1>
          {isOwner ? (
            <div className="local-selector" onClick={e => { e.stopPropagation(); setLocalMenuOpen(o => !o); }}>
              <span className="local-selector-label">🏪 {activeLocalName}</span>
              <span style={{ fontSize: 10, marginLeft: 2 }}>▾</span>
              {localMenuOpen && (
                <div className="local-dropdown">
                  {LOCALS.map(l => (
                    <div key={l.id} className={`local-option${effectiveLocal === l.id ? " active" : ""}`} onClick={() => switchLocal(l.id)}>
                      {effectiveLocal === l.id ? "✓ " : ""}{l.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="local-badge">🏪 {activeLocalName}</span>
          )}
          <span className={`role-badge ${isOwner ? "role-owner" : "role-collab"}`}>{isOwner ? "👑" : "👤"}</span>
          <button className="logout-btn" onClick={() => signOut(auth)}>Salir</button>
        </div>
        <div className="main">
          {view === "sale"      && <SaleView products={products} userProfile={userProfile} categories={categories} localName={activeLocalName} />}
          {view === "inventory" && <InventoryView products={products} userProfile={userProfile} categories={categories} />}
          {view === "history"   && <HistoryView sales={sales} />}
          {view === "reports"   && <ReportsView sales={sales} products={products} />}
          {view === "perms"     && <PermissionsView />}
          {view === "ai" && canUseAI && <AIChat products={products} sales={sales} userProfile={userProfile} />}
          {view === "docs"      && <DocsView userProfile={userProfile} />}
          {view === "settings"  && <SettingsView userProfile={userProfile} />}
        </div>

        {/* ── Modal "Más" ────────────────────────────────────────────── */}
        {moreOpen && (
          <div className="more-overlay" onClick={() => setMoreOpen(false)}>
            <div className="more-sheet" onClick={e => e.stopPropagation()}>
              <div className="more-handle" />
              <div className="more-sheet-title">Más opciones</div>
              <div className="more-grid">
                {moreItems.map(item => (
                  <button key={item.id} className="more-item" onClick={() => goTo(item.id)}>
                    <span className="more-icon">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <nav className="bottom-nav">
          {navItems.map(n => (
            <button key={n.id} className={`bn-btn${view === n.id ? " active" : ""}`} onClick={() => setView(n.id)}>
              <span className="bn-icon">{n.icon}</span>{n.label}
            </button>
          ))}
          <button className={`bn-btn${moreOpen || ["reports","ai","docs","settings"].includes(view) ? " active" : ""}`} onClick={() => setMoreOpen(o => !o)}>
            <span className="bn-icon">⋯</span>Más
          </button>
        </nav>
      </div>
    </LocalCtx.Provider>
  );
}
