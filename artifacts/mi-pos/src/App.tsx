// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { db, auth, storage } from "./firebase";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, addDoc,
  serverTimestamp, query, orderBy, updateDoc
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CATEGORIES = ["Todas", "Lácteos", "Básicos", "Aceites", "Panadería", "Snacks", "Enlatados", "Bebidas", "Frutas y Verd.", "Higiene", "Limpieza"];
const fmt = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #141824; border-top: 1px solid #2a3045; z-index: 50; display: flex; justify-content: space-around; padding: 6px 0 10px; }
  .bn-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; color: #6b7280; font-size: 10px; cursor: pointer; padding: 4px 10px; font-family: 'Inter', sans-serif; }
  .bn-btn .bn-icon { font-size: 20px; }
  .bn-btn.active { color: #00c896; }
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
  @keyframes toast-in { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
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
function ScannerModal({ products, onFound, onClose }) {
  const [status, setStatus]     = useState("Iniciando cámara...");
  const [statusType, setStatusType] = useState("");
  const [manualCode, setManualCode] = useState("");
  const html5QrRef  = useRef(null);
  const startedRef  = useRef(false);
  // aliveRef gates the one-time onFound dispatch — prevents duplicate calls
  // when the scanner fires the success callback multiple times at 10fps.
  const aliveRef    = useRef(true);
  // Keep latest props in refs so the scanner callback never sees stale closures.
  const productsRef = useRef(products);
  const onFoundRef  = useRef(onFound);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { onFoundRef.current  = onFound;  }, [onFound]);

  // handleCode is stable (no deps) — all dynamic data accessed via refs.
  const handleCode = (code) => {
    if (!code) return;
    const found = productsRef.current.find(p => p.barcode === code);
    if (found) {
      if (!aliveRef.current) return; // already dispatched — ignore duplicates
      aliveRef.current  = false;     // lock: only one dispatch ever
      startedRef.current = false;
      setStatus(`✓ ${found.name}`);
      setStatusType("found");
      if (html5QrRef.current) html5QrRef.current.stop().catch(() => {});
      // Short delay so user sees the confirmation before the modal closes
      setTimeout(() => onFoundRef.current(found), 500);
    } else {
      setStatus(`Código ${code} no registrado. Intentá de nuevo.`);
      setStatusType("notfound");
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
      } else {
        setStatus("Cámara no disponible. Ingresá el código manualmente.");
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
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError]   = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeFlash, setBarcodeFlash] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fileRef   = useRef();
  const cameraRef = useRef();
  const lastKeyTime = useRef(0);
  const physicalBuf = useRef("");

  const handleImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setImgError("");
    try {
      const imgRef = ref(storage, `products/${Date.now()}.jpg`);
      await uploadBytes(imgRef, file);
      const url = await getDownloadURL(imgRef);
      set("img", url);
    } catch (err) {
      const code = err?.code ?? "";
      if (code === "storage/unauthorized" || code === "storage/unauthenticated") {
        setImgError("Sin permiso en Storage. Actualizá las reglas en Firebase Console (Storage → Reglas).");
      } else if (code.startsWith("storage/")) {
        setImgError(`Error de Storage: ${code}`);
      } else {
        setImgError(`Error al subir: ${err?.message ?? String(err)}`);
      }
    } finally {
      setUploading(false);
    }
  };

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{product ? "Editar producto" : "Nuevo producto"}</h2>
        <div className="modal-section">
          <div className="modal-label">Foto</div>
          {/* Gallery picker — no capture attribute, opens file browser / gallery */}
          <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={handleImg} />
          {/* Camera picker — capture="environment" opens rear camera directly on mobile */}
          <input type="file" accept="image/*" capture="environment" ref={cameraRef} style={{ display: "none" }} onChange={handleImg} />

          {uploading ? (
            <div className="img-upload" style={{ cursor: "default" }}>
              <span style={{ fontSize: 22 }}>⏳</span>
              <span>Subiendo...</span>
            </div>
          ) : form.img ? (
            <div>
              <img src={form.img} className="img-preview" alt="" style={{ marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => { setImgError(""); fileRef.current.click(); }}
                  style={{ flex: 1, background: "#252b3b", border: "1px solid #3a4158", borderRadius: 8, color: "#9ca3af", fontSize: 12, padding: "7px 0", cursor: "pointer" }}>
                  🖼️ Galería
                </button>
                <button type="button" onClick={() => { setImgError(""); cameraRef.current.click(); }}
                  style={{ flex: 1, background: "#252b3b", border: "1px solid #3a4158", borderRadius: 8, color: "#9ca3af", fontSize: 12, padding: "7px 0", cursor: "pointer" }}>
                  📷 Cámara
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="img-upload" style={{ flex: 1 }} onClick={() => { setImgError(""); fileRef.current.click(); }}>
                  <span style={{ fontSize: 20 }}>🖼️</span>
                  <span>Galería</span>
                </div>
                <div className="img-upload" style={{ flex: 1 }} onClick={() => { setImgError(""); cameraRef.current.click(); }}>
                  <span style={{ fontSize: 20 }}>📷</span>
                  <span>Cámara</span>
                </div>
              </div>
              {imgError && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: "#2d1515", border: "1px solid #7f1d1d", borderRadius: 8, color: "#fca5a5", fontSize: 11, lineHeight: 1.4 }}>
                  ⚠️ {imgError}
                </div>
              )}
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
          <button className="btn-primary" disabled={uploading} onClick={() => {
            if (form.name && form.price) onSave({ ...form, price: parseFloat(form.price), stock: parseFloat(form.stock) || 0, minStock: parseInt(form.minStock) || 6 });
          }}>Guardar</button>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── SuccessModal ─────────────────────────────────────────────────────────────
// ─── ESC/POS utilities ────────────────────────────────────────────────────────
const _ESC=0x1B,_GS=0x1D,_LF=0x0A,_PW=32;
function escNorm(s){return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7E]/g,"?");}
function escBytes(text){const t=escNorm(text);const b=[];for(let i=0;i<t.length;i++)b.push(t.charCodeAt(i));b.push(_LF);return b;}
function escCenter(text){const t=escNorm(text);const pad=Math.max(0,Math.floor((_PW-t.length)/2));return escBytes(" ".repeat(pad)+t);}
function escLR(left,right){const l=escNorm(left),r=escNorm(right);const gap=Math.max(1,_PW-l.length-r.length);return escBytes(l+" ".repeat(gap)+r);}
function escSep(ch="-"){return escBytes(ch.repeat(_PW));}

function buildTicket(sale,biz="MI POS"){
  const now=sale.date?.toDate?sale.date.toDate():new Date();
  const ds=now.toLocaleDateString("es-AR"),ts=now.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
  const b=[_ESC,0x40,_ESC,0x61,0x01,_ESC,0x45,0x01,_GS,0x21,0x11,...escBytes(biz),_GS,0x21,0x00,_ESC,0x45,0x00,
    ...escSep("="),...escCenter(`${ds}  ${ts}`),...escCenter(`Folio: ${(sale.id||"").slice(-8)}`),
    ...escSep("-"),_ESC,0x61,0x00];
  for(const item of(sale.items||[])){
    const nm=escNorm(item.name).slice(0,17).padEnd(17);
    const qt=`x${Number(item.qty).toFixed(item.type==="kg"?2:0)}`.padStart(5);
    const pr=`$${Number(item.price*item.qty).toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2})}`.padStart(8);
    b.push(...escBytes(nm+qt+pr));
  }
  b.push(...escSep("-"),_ESC,0x45,0x01,...escLR("TOTAL:",fmt(sale.total)),_ESC,0x45,0x00,...escLR("Metodo:",sale.method||""));
  if(sale.method==="Efectivo"){b.push(...escLR("Recibido:",fmt(sale.received||0)),...escLR("Vuelto:",fmt(Math.max(0,sale.change||0))));}
  b.push(...escSep("="),_ESC,0x61,0x01,...escCenter("Gracias por su compra!"),_LF,_LF,_LF,_GS,0x56,0x41,0x10);
  return new Uint8Array(b);
}

function buildSalesReport(sales,biz="MI POS"){
  const today=new Date().toLocaleDateString("es-AR");
  const ts=sales.filter(s=>{try{return(s.date?.toDate?s.date.toDate():new Date(s.date)).toLocaleDateString("es-AR")===today;}catch{return false;}});
  const total=ts.reduce((s,v)=>s+v.total,0);
  const b=[_ESC,0x40,_ESC,0x61,0x01,_ESC,0x45,0x01,_GS,0x21,0x11,...escBytes(biz),_GS,0x21,0x00,_ESC,0x45,0x00,
    ...escSep("="),...escCenter("REPORTE DE VENTAS"),...escCenter(today),...escSep("="),_ESC,0x61,0x00,
    _ESC,0x45,0x01,...escLR("Transacciones:",String(ts.length)),...escLR("Total vendido:",fmt(total)),_ESC,0x45,0x00,...escSep("-")];
  for(const s of ts.slice(0,20)){
    const d=s.date?.toDate?s.date.toDate():new Date(s.date);
    b.push(...escLR(d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})+" "+escNorm(s.method||""),fmt(s.total)));
  }
  if(ts.length>20)b.push(...escBytes(`  ...y ${ts.length-20} mas`));
  b.push(...escSep("="),_ESC,0x61,0x01,...escCenter("Mi POS"),_LF,_LF,_LF,_GS,0x56,0x41,0x10);
  return new Uint8Array(b);
}

function buildLowStockReport(products,biz="MI POS"){
  const low=products.filter(p=>p.stock<(p.minStock??6));
  const b=[_ESC,0x40,_ESC,0x61,0x01,_ESC,0x45,0x01,_GS,0x21,0x11,...escBytes(biz),_GS,0x21,0x00,_ESC,0x45,0x00,
    ...escSep("="),...escCenter("STOCK BAJO"),...escCenter(new Date().toLocaleDateString("es-AR")),...escSep("="),_ESC,0x61,0x00];
  if(low.length===0){b.push(...escCenter("Todo en orden! :)"));}
  else{
    b.push(_ESC,0x45,0x01,...escBytes("Producto          Stk  Min"),_ESC,0x45,0x00,...escSep("-"));
    for(const p of low){
      const nm=escNorm(p.name).slice(0,18).padEnd(18);
      b.push(...escBytes(nm+String(p.stock).padStart(4)+String(p.minStock??6).padStart(4)));
    }
  }
  b.push(...escSep("="),_ESC,0x61,0x01,...escCenter("Mi POS"),_LF,_LF,_LF,_GS,0x56,0x41,0x10);
  return new Uint8Array(b);
}

// ─── Bluetooth printer hook ────────────────────────────────────────────────────
const BT_PROFILES=[
  {svc:"000018f0-0000-1000-8000-00805f9b34fb",chr:"00002af1-0000-1000-8000-00805f9b34fb"},
  {svc:"e7810a71-73ae-499d-8c15-faa9aef0c3f2",chr:"bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"},
  {svc:"49535343-fe7d-4ae5-8fa9-9fafd205e455",chr:"49535343-8841-43f4-a8d4-ecbe34729bb3"},
  {svc:"6e400001-b5a3-f393-e0a9-e50e24dcca9e",chr:"6e400002-b5a3-f393-e0a9-e50e24dcca9e"},
];

function useBTPrinter(){
  const [status,setStatus]=useState("idle"); // idle|connecting|connected|printing|error
  const [errMsg,setErrMsg]=useState("");
  const [devName,setDevName]=useState("");
  const charRef=useRef(null);
  const devRef=useRef(null);

  const connect=async()=>{
    if(!navigator?.bluetooth){setStatus("error");setErrMsg("Web Bluetooth no disponible. Usa Chrome en Android.");return false;}
    setStatus("connecting");setErrMsg("");
    try{
      const dev=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:BT_PROFILES.map(p=>p.svc)});
      devRef.current=dev;setDevName(dev.name||"Impresora");
      dev.addEventListener("gattserverdisconnected",()=>{charRef.current=null;setStatus("idle");setDevName("");});
      const server=await dev.gatt.connect();
      let chr=null;
      for(const prof of BT_PROFILES){try{const svc=await server.getPrimaryService(prof.svc);chr=await svc.getCharacteristic(prof.chr);break;}catch{}}
      if(!chr){
        try{
          const svcs=await server.getPrimaryServices();
          outer:for(const svc of svcs){const chars=await svc.getCharacteristics();for(const c of chars){if(c.properties.writeWithoutResponse||c.properties.write){chr=c;break outer;}}}
        }catch{}
      }
      if(!chr)throw new Error("No se encontro caracteristica de escritura. Probá con otra impresora.");
      charRef.current=chr;setStatus("connected");return true;
    }catch(err){
      charRef.current=null;setDevName("");
      if(err.name==="NotFoundError"){setStatus("idle");}
      else{setStatus("error");setErrMsg(err.message||String(err));}
      return false;
    }
  };

  const disconnect=()=>{devRef.current?.gatt?.disconnect();charRef.current=null;setStatus("idle");setDevName("");};

  const print=async(bytes)=>{
    if(!charRef.current){const ok=await connect();if(!ok)return;}
    setStatus("printing");
    try{
      const chr=charRef.current;
      const noResp=chr.properties.writeWithoutResponse;
      for(let i=0;i<bytes.length;i+=100){
        const chunk=bytes.slice(i,i+100);
        if(noResp&&chr.writeValueWithoutResponse)await chr.writeValueWithoutResponse(chunk);
        else await chr.writeValue(chunk);
        await new Promise(r=>setTimeout(r,50));
      }
      setStatus("connected");
    }catch(err){setStatus("error");setErrMsg(err.message||String(err));}
  };

  return {status,errMsg,devName,connect,disconnect,print};
}

// ─── PrintBtn ──────────────────────────────────────────────────────────────────
function PrintBtn({label,onPrint,printer}){
  const {status,errMsg,devName}=printer;
  const busy=status==="printing"||status==="connecting";
  const conn=status==="connected";
  const txt=status==="printing"?"Imprimiendo...":status==="connecting"?"Conectando...":conn?label:`📡 ${label}`;
  return(
    <div style={{marginBottom:8}}>
      <button className={`print-btn${conn?" bt-connected":""}`} onClick={onPrint} disabled={busy}>
        <span style={{fontSize:15}}>{busy?"⏳":conn?"🖨️":"📡"}</span>
        <span>{txt}</span>
        {conn&&devName&&<span style={{fontSize:10,opacity:0.65,marginLeft:"auto",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80}}>{devName}</span>}
        {conn&&<button onClick={e=>{e.stopPropagation();printer.disconnect();}} style={{marginLeft:4,background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:13,padding:0}} title="Desconectar">✕</button>}
      </button>
      {status==="error"&&errMsg&&<div className="bt-error">⚠️ {errMsg}</div>}
    </div>
  );
}

// ─── SuccessModal ──────────────────────────────────────────────────────────────
function SuccessModal({ sale, onClose, btPrinter }) {
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
        <PrintBtn label="Imprimir ticket" onPrint={() => btPrinter.print(buildTicket(sale))} printer={btPrinter} />
        <button className="btn-primary" onClick={onClose} style={{ width: "100%", marginTop: 4 }}>Nueva venta</button>
      </div>
    </div>
  );
}

// ─── SaleView ─────────────────────────────────────────────────────────────────
function SaleView({ products, userProfile, categories, btPrinter }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const [cart, setCart] = useState([]);
  const [kgModal, setKgModal] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [noStockId, setNoStockId]     = useState(null);   // product id flashing red
  const [stockToast, setStockToast]   = useState(null);   // product name shown in toast
  const noStockTimer = useRef(null);
  const barcodeBuffer = useRef("");
  const barcodeTimer  = useRef(null);
  // Refs so the keydown handler never sees stale closures and never re-registers
  const barcodeProductsRef      = useRef(products);
  const handleProductClickRef   = useRef(null);    // assigned after function is defined
  useEffect(() => { barcodeProductsRef.current = products; }, [products]);

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
      // Flash the card red and show toast — do NOT add to cart
      clearTimeout(noStockTimer.current);
      setNoStockId(p.id);
      setStockToast(p.name);
      noStockTimer.current = setTimeout(() => { setNoStockId(null); setStockToast(null); }, 2400);
      return;
    }
    if (p.type === "kg") setKgModal(p); else addToCart(p, 1);
  };
  // Keep ref current every render so the keydown handler always calls latest version
  handleProductClickRef.current = handleProductClick;
  const updateQty = (id, val) => { const n = parseFloat(val); if (isNaN(n) || n <= 0) return setCart(c => c.filter(i => i.id !== id)); setCart(c => c.map(i => i.id === id ? { ...i, qty: n } : i)); };
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handlePay = async (method, received, change) => {
    const saleData = { method, received, change, total, items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, unit: i.unit })), date: serverTimestamp(), cashier: userProfile?.email || "" };
    const saleRef = await addDoc(collection(db, "sales"), saleData);
    // Update stock
    for (const item of cart) {
      const newStock = Math.max(0, (item.stock || 0) - item.qty);
      await updateDoc(doc(db, "products", item.id), { stock: newStock });
    }
    setSuccessModal({ ...saleData, id: saleRef.id });
    setCart([]);
    setPayModal(false);
  };

  const getCatEmoji = (cat) => ({ "Lácteos": "🥛", "Bebidas": "🥤", "Higiene": "🧴", "Limpieza": "🧹", "Frutas y Verd.": "🥦", "Snacks": "🍪", "Enlatados": "🥫", "Panadería": "🍞" }[cat] || "📦");

  return (
    <div className="content sale-content">
      {scannerOpen && <ScannerModal products={products} onFound={p => { setScannerOpen(false); handleProductClick(p); }} onClose={() => setScannerOpen(false)} />}
      {stockToast && (
        <div className="no-stock-toast">
          <span>🚫</span>
          <span>Sin stock · {stockToast}</span>
        </div>
      )}
      {kgModal && <KgModal product={kgModal} onConfirm={kg => { addToCart(kgModal, kg); setKgModal(null); }} onClose={() => setKgModal(null)} />}
      {payModal && <PayModal total={total} onConfirm={handlePay} onClose={() => setPayModal(false)} />}
      {successModal && <SuccessModal sale={successModal} onClose={() => setSuccessModal(null)} btPrinter={btPrinter} />}
      <div className="products-area">
        <div className="search-row">
          <div className="search-box"><span className="search-icon">🔍</span><input placeholder="Nombre o código..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="scan-btn" onClick={() => setScannerOpen(true)}>📷 Scan</button>
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

  const persist = async (newList) => {
    setSaving(true);
    await setDoc(doc(db, "settings", "categories"), { list: newList });
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
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState(null);
  const [showCats, setShowCats] = useState(false);
  const canEdit = userProfile?.role === "owner" || userProfile?.permissions?.editInventory;

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search)));

  const handleSave = async (p) => {
    const { id, ...data } = p;
    if (id) await setDoc(doc(db, "products", id), data);
    else await addDoc(collection(db, "products"), data);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este producto?")) await deleteDoc(doc(db, "products", id));
  };

  return (
    <div className="content">
      {modal && <ProductModal product={modal === "new" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} categories={categories} />}
      {showCats && <CategoriesModal categories={categories} onClose={() => setShowCats(false)} />}
      <div className="inv-area">
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div className="search-box" style={{ flex: 1 }}><span className="search-icon">🔍</span><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          {canEdit && <button className="btn-add" style={{ background: "#3a4158", border: "1px solid #4a5168", fontSize: 18, padding: "6px 10px" }} onClick={() => setShowCats(true)} title="Gestionar categorías">🏷️</button>}
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
function ReportsView({ sales, products, btPrinter }) {
  const totalVentas = sales.reduce((s, v) => s + v.total, 0);
  const totalItems = sales.reduce((s, v) => s + (v.items || []).reduce((ss, i) => ss + i.qty, 0), 0);
  const methods = sales.reduce((acc, v) => { acc[v.method] = (acc[v.method] || 0) + v.total; return acc; }, {});
  const topProducts = Object.values(sales.flatMap(v => v.items || []).reduce((acc, i) => {
    acc[i.id] = acc[i.id] || { name: i.name, total: 0 };
    acc[i.id].total += i.price * i.qty;
    return acc;
  }, {})).sort((a, b) => b.total - a.total).slice(0, 5);
  const maxTop = topProducts[0]?.total || 1;

  return (
    <div className="content">
      <div className="rep-area">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Ventas totales</div><div className="stat-value stat-green">{fmt(totalVentas)}</div></div>
          <div className="stat-card"><div className="stat-label">Transacciones</div><div className="stat-value stat-blue">{sales.length}</div></div>
          <div className="stat-card"><div className="stat-label">Artículos</div><div className="stat-value stat-orange">{totalItems.toFixed(1)}</div></div>
          <div className="stat-card"><div className="stat-label">Ticket prom.</div><div className="stat-value stat-green">{fmt(sales.length ? totalVentas / sales.length : 0)}</div></div>
          <div className="stat-card"><div className="stat-label">Productos</div><div className="stat-value stat-blue">{products.length}</div></div>
          <div className="stat-card"><div className="stat-label">Stock bajo</div><div className="stat-value" style={{ color: "#ff6b6b" }}>{products.filter(p => p.stock < (p.minStock ?? 6)).length}</div></div>
        </div>
        <div className="rep-section">
          <h3>💳 Por método de pago</h3>
          {Object.keys(methods).length === 0 && <div style={{ color: "#6b7280", fontSize: 12 }}>Sin datos</div>}
          {Object.entries(methods).map(([m, v]) => <div key={m} className="rep-row"><span>{m}</span><span style={{ fontFamily: "monospace", color: "#00c896" }}>{fmt(v)}</span></div>)}
        </div>
        <div className="rep-section">
          <h3>🏆 Top 5 productos</h3>
          {topProducts.length === 0 && <div style={{ color: "#6b7280", fontSize: 12 }}>Sin datos</div>}
          {topProducts.map((p, i) => (
            <div key={p.name} style={{ marginBottom: 8 }}>
              <div className="rep-row" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <span style={{ color: i === 0 ? "#fbbf24" : "#e8eaf0" }}>{i + 1}. {p.name}</span>
                <span style={{ fontFamily: "monospace", color: "#00c896" }}>{fmt(p.total)}</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${(p.total / maxTop) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="rep-section">
          <h3>⚠️ Stock bajo</h3>
          {products.filter(p => p.stock < (p.minStock ?? 6)).length === 0 && <div style={{ color: "#6b7280", fontSize: 12 }}>Todo bien ✓</div>}
          {products.filter(p => p.stock < (p.minStock ?? 6)).map(p => <div key={p.id} className="rep-row"><span>{p.name}</span><span style={{ color: "#ff6b6b" }}>{p.stock} {p.unit}</span></div>)}
        </div>
        <div className="print-section">
          <h3>🖨️ IMPRIMIR</h3>
          <PrintBtn label="Ventas del día" onPrint={() => btPrinter.print(buildSalesReport(sales))} printer={btPrinter} />
          <PrintBtn label="Stock bajo" onPrint={() => btPrinter.print(buildLowStockReport(products))} printer={btPrinter} />
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, lineHeight: 1.5 }}>
            Primera vez: se abrirá el selector Bluetooth para elegir la impresora. Las siguientes impresiones van directo sin volver a preguntar.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PermissionsView ──────────────────────────────────────────────────────────
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

  const perms = [
    { key: "sell", label: "Registrar ventas" },
    { key: "viewInventory", label: "Ver inventario" },
    { key: "editInventory", label: "Editar inventario" },
    { key: "viewReports", label: "Ver reportes" },
  ];

  return (
    <div className="content">
      <div className="perm-area">
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>Controlá los permisos de cada colaborador</div>
        {users.filter(u => u.role !== "owner").map(u => (
          <div key={u.id} className="perm-card">
            <div className="perm-email">👤 {u.name || u.email}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{u.email}</div>
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

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [view, setView] = useState("sale");
  const [products, setProducts]     = useState([]);
  const [sales, setSales]           = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [categories, setCategories] = useState(CATEGORIES.filter(c => c !== "Todas"));
  const btPrinter = useBTPrinter();

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

  // Load products from Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "products"), async (snap) => {
      if (snap.empty && !initialized) {
        // Seed initial products
        for (const p of INITIAL_PRODUCTS) {
          const { id, ...data } = p;
          await setDoc(doc(db, "products", id), data);
        }
        setInitialized(true);
      } else {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setInitialized(true);
      }
    });
    return unsub;
  }, [user]);

  // Load sales
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "sales"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, snap => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  // Load categories from Firestore (real-time); seed defaults if first run
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "settings", "categories"), (snap) => {
      if (snap.exists()) {
        setCategories(snap.data().list || []);
      } else {
        const defaults = CATEGORIES.filter(c => c !== "Todas");
        setDoc(doc(db, "settings", "categories"), { list: defaults });
        setCategories(defaults);
      }
    });
    return unsub;
  }, [user]);

  if (authLoading) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#1a1f2e", color: "#00c896", gap: 12 }}>
      <div style={{ fontSize: 36 }}>🛒</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>Conectando con Firebase…</div>
    </div>
  );
  if (!user) return <><style>{css}</style><LoginScreen firebaseError={authError} /></>;

  const isOwner = userProfile?.role === "owner";
  const perms = userProfile?.permissions || {};

  const navItems = [
    { id: "sale", icon: "🛒", label: "Venta", show: perms.sell || isOwner },
    { id: "inventory", icon: "📦", label: "Inventario", show: perms.viewInventory || isOwner },
    { id: "history", icon: "📋", label: "Historial", show: isOwner },
    { id: "reports", icon: "📊", label: "Reportes", show: perms.viewReports || isOwner },
    { id: "perms", icon: "👥", label: "Equipo", show: isOwner },
  ].filter(n => n.show);

  const titles = { sale: "Mi POS 2", inventory: "Inventario", history: "Historial", reports: "Reportes", perms: "Mi Equipo" };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="top-header">
          <div className="logo">PV</div>
          <h1>{titles[view]}</h1>
          <span className={`role-badge ${isOwner ? "role-owner" : "role-collab"}`}>{isOwner ? "👑 Propietario" : "👤 Colaborador"}</span>
          <button className="logout-btn" onClick={() => signOut(auth)}>Salir</button>
        </div>
        <div className="main">
          {view === "sale" && <SaleView products={products} userProfile={userProfile} categories={categories} btPrinter={btPrinter} />}
          {view === "inventory" && <InventoryView products={products} userProfile={userProfile} categories={categories} />}
          {view === "history" && <HistoryView sales={sales} />}
          {view === "reports" && <ReportsView sales={sales} products={products} btPrinter={btPrinter} />}
          {view === "perms" && <PermissionsView />}
        </div>
        <nav className="bottom-nav">
          {navItems.map(n => <button key={n.id} className={`bn-btn${view === n.id ? " active" : ""}`} onClick={() => setView(n.id)}><span className="bn-icon">{n.icon}</span>{n.label}</button>)}
        </nav>
      </div>
    </>
  );
}
