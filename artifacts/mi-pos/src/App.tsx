// @ts-nocheck
import { useState, useEffect, useRef } from "react";

const INITIAL_PRODUCTS = [
  // Alimentos básicos Argentina
  { id: 1, name: "Leche La Serenísima 1L", category: "Lácteos", type: "unit", price: 850, stock: 30, unit: "pza", barcode: "7790070010015", img: "" },
  { id: 2, name: "Yogur Ser Natural 190g", category: "Lácteos", type: "unit", price: 430, stock: 24, unit: "pza", barcode: "7790070040012", img: "" },
  { id: 3, name: "Queso Cremoso La Paulina kg", category: "Lácteos", type: "kg", price: 4200, stock: 5, unit: "kg", barcode: "", img: "" },
  { id: 4, name: "Manteca La Serenísima 200g", category: "Lácteos", type: "unit", price: 980, stock: 20, unit: "pza", barcode: "7790070020014", img: "" },
  { id: 5, name: "Aceite Natura Girasol 1.5L", category: "Aceites", type: "unit", price: 1850, stock: 25, unit: "pza", barcode: "7790788010018", img: "" },
  { id: 6, name: "Arroz Marolio 1kg", category: "Básicos", type: "unit", price: 650, stock: 40, unit: "pza", barcode: "7790430000019", img: "" },
  { id: 7, name: "Fideos Matarazzo Spaghetti 500g", category: "Básicos", type: "unit", price: 420, stock: 35, unit: "pza", barcode: "7790895000016", img: "" },
  { id: 8, name: "Harina 000 Cañuelas 1kg", category: "Básicos", type: "unit", price: 480, stock: 30, unit: "pza", barcode: "7790380000017", img: "" },
  { id: 9, name: "Azúcar Ledesma 1kg", category: "Básicos", type: "unit", price: 550, stock: 40, unit: "pza", barcode: "7790450000013", img: "" },
  { id: 10, name: "Sal Celusal 1kg", category: "Básicos", type: "unit", price: 280, stock: 50, unit: "pza", barcode: "7790380010016", img: "" },
  { id: 11, name: "Pan Lactal Bimbo", category: "Panadería", type: "unit", price: 980, stock: 15, unit: "pza", barcode: "7792200000011", img: "" },
  { id: 12, name: "Galletitas Oreo 117g", category: "Snacks", type: "unit", price: 650, stock: 20, unit: "pza", barcode: "7622210951873", img: "" },
  { id: 13, name: "Galletitas 9de Oro Crackers", category: "Snacks", type: "unit", price: 480, stock: 25, unit: "pza", barcode: "7790040000014", img: "" },
  { id: 14, name: "Mermelada Arcor Frutilla 390g", category: "Básicos", type: "unit", price: 720, stock: 18, unit: "pza", barcode: "7790580000010", img: "" },
  { id: 15, name: "Dulce de Leche Sancor 400g", category: "Básicos", type: "unit", price: 850, stock: 20, unit: "pza", barcode: "7790450010012", img: "" },
  { id: 16, name: "Tomate Triturado La Valle 520g", category: "Enlatados", type: "unit", price: 480, stock: 30, unit: "pza", barcode: "7790080000018", img: "" },
  { id: 17, name: "Atún al Natural Cándida 170g", category: "Enlatados", type: "unit", price: 650, stock: 25, unit: "pza", barcode: "7790130000014", img: "" },
  { id: 18, name: "Café Nescafé Clásico 170g", category: "Bebidas", type: "unit", price: 1850, stock: 15, unit: "pza", barcode: "7791290010017", img: "" },
  { id: 19, name: "Yerba Mate Cruz de Malta 1kg", category: "Bebidas", type: "unit", price: 1650, stock: 20, unit: "pza", barcode: "7790110000011", img: "" },
  { id: 20, name: "Coca-Cola 2.25L", category: "Bebidas", type: "unit", price: 1200, stock: 18, unit: "pza", barcode: "7790895010015", img: "" },
  { id: 21, name: "Agua Villavicencio 1.5L", category: "Bebidas", type: "unit", price: 450, stock: 30, unit: "pza", barcode: "7790100000012", img: "" },
  // Frutas y verduras
  { id: 22, name: "Manzana", category: "Frutas y Verd.", type: "kg", price: 800, stock: 20, unit: "kg", barcode: "", img: "" },
  { id: 23, name: "Banana", category: "Frutas y Verd.", type: "kg", price: 650, stock: 15, unit: "kg", barcode: "", img: "" },
  { id: 24, name: "Tomate", category: "Frutas y Verd.", type: "kg", price: 900, stock: 10, unit: "kg", barcode: "", img: "" },
  { id: 25, name: "Papa", category: "Frutas y Verd.", type: "kg", price: 550, stock: 25, unit: "kg", barcode: "", img: "" },
  { id: 26, name: "Cebolla", category: "Frutas y Verd.", type: "kg", price: 480, stock: 20, unit: "kg", barcode: "", img: "" },
  // Higiene personal
  { id: 27, name: "Shampoo Elvive 400ml", category: "Higiene", type: "unit", price: 1850, stock: 12, unit: "pza", barcode: "7509546054927", img: "" },
  { id: 28, name: "Jabón Dove 90g", category: "Higiene", type: "unit", price: 680, stock: 20, unit: "pza", barcode: "7791293020011", img: "" },
  { id: 29, name: "Pasta dental Colgate 90g", category: "Higiene", type: "unit", price: 750, stock: 18, unit: "pza", barcode: "7509546675932", img: "" },
  { id: 30, name: "Desodorante Rexona 150ml", category: "Higiene", type: "unit", price: 1200, stock: 15, unit: "pza", barcode: "7791293030010", img: "" },
  { id: 31, name: "Papel higiénico Elite x4", category: "Higiene", type: "unit", price: 980, stock: 20, unit: "pza", barcode: "7790290000016", img: "" },
  { id: 32, name: "Toallitas húmedas Huggies", category: "Higiene", type: "unit", price: 850, stock: 15, unit: "pza", barcode: "7796225000014", img: "" },
  // Limpieza
  { id: 33, name: "Detergente Magistral 750ml", category: "Limpieza", type: "unit", price: 780, stock: 20, unit: "pza", barcode: "7790150000013", img: "" },
  { id: 34, name: "Lavandina Ayudín 1L", category: "Limpieza", type: "unit", price: 480, stock: 25, unit: "pza", barcode: "7790160000012", img: "" },
  { id: 35, name: "Limpiador Pino Sol 500ml", category: "Limpieza", type: "unit", price: 650, stock: 18, unit: "pza", barcode: "7790170000011", img: "" },
  { id: 36, name: "Jabón en polvo Ala 800g", category: "Limpieza", type: "unit", price: 1100, stock: 15, unit: "pza", barcode: "7791293040019", img: "" },
  { id: 37, name: "Suavizante Comfort 900ml", category: "Limpieza", type: "unit", price: 980, stock: 12, unit: "pza", barcode: "7791293050018", img: "" },
  { id: 38, name: "Esponja Scotch Brite x2", category: "Limpieza", type: "unit", price: 520, stock: 20, unit: "pza", barcode: "7501000630022", img: "" },
];

const CATEGORIES = ["Todas", "Lácteos", "Básicos", "Aceites", "Panadería", "Snacks", "Enlatados", "Bebidas", "Frutas y Verd.", "Higiene", "Limpieza"];
const fmt = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #1a1f2e; color: #e8eaf0; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #1a1f2e; }
  ::-webkit-scrollbar-thumb { background: #3a4158; border-radius: 3px; }

  .app { display: flex; height: 100vh; overflow: hidden; flex-direction: column; }

  /* Top header */
  .top-header { padding: 10px 16px; border-bottom: 1px solid #2a3045; display: flex; align-items: center; gap: 12px; background: #1e2438; flex-shrink: 0; }
  .logo { width: 34px; height: 34px; background: linear-gradient(135deg, #00c896, #00a87a); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0; }
  .top-header h1 { font-size: 15px; font-weight: 700; color: #e8eaf0; }
  .top-header .date { margin-left: auto; font-size: 11px; color: #6b7280; white-space: nowrap; }

  /* Bottom nav */
  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #141824; border-top: 1px solid #2a3045; z-index: 50; display: flex; justify-content: space-around; padding: 6px 0 10px; }
  .bn-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; color: #6b7280; font-size: 10px; cursor: pointer; padding: 4px 10px; font-family: 'Inter', sans-serif; transition: color .15s; }
  .bn-btn .bn-icon { font-size: 20px; }
  .bn-btn.active { color: #00c896; }

  /* Main */
  .main { flex: 1; overflow: hidden; display: flex; flex-direction: column; padding-bottom: 60px; }
  .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

  /* Desktop side-by-side */
  @media (min-width: 700px) {
    .content { flex-direction: row; }
    .cart { width: 300px; border-left: 1px solid #2a3045; border-top: none; max-height: unset; }
    .bottom-nav { display: none; }
    .sidebar-desktop { display: flex !important; }
    .app { flex-direction: row; }
    .main { padding-bottom: 0; }
    .top-header { display: none; }
  }

  /* Desktop sidebar */
  .sidebar-desktop { display: none; width: 72px; background: #141824; flex-direction: column; align-items: center; padding: 16px 0; gap: 8px; border-right: 1px solid #2a3045; flex-shrink: 0; }
  .sd-logo { width: 40px; height: 40px; background: linear-gradient(135deg, #00c896, #00a87a); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: #fff; margin-bottom: 16px; }
  .sd-btn { width: 44px; height: 44px; border: none; background: transparent; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 20px; transition: all .2s; position: relative; }
  .sd-btn:hover { background: #252b3b; color: #e8eaf0; }
  .sd-btn.active { background: #1e3a2f; color: #00c896; }
  .sd-btn .tip { position: absolute; left: 56px; background: #252b3b; color: #e8eaf0; font-size: 12px; padding: 4px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .15s; border: 1px solid #3a4158; z-index: 100; }
  .sd-btn:hover .tip { opacity: 1; }

  /* Products */
  .products-area { flex: 1; overflow-y: auto; padding: 12px; }
  .search-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; }
  .search-box { flex: 1; position: relative; }
  .search-box input { width: 100%; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 8px 10px 8px 32px; color: #e8eaf0; font-size: 13px; outline: none; font-family: 'Inter', sans-serif; }
  .search-box input::placeholder { color: #6b7280; }
  .search-box input:focus { border-color: #00c896; }
  .search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #6b7280; font-size: 14px; }
  .scan-btn { display: flex; align-items: center; gap: 5px; padding: 8px 12px; background: #1e3a2f; border: 1px solid #00c896; border-radius: 8px; color: #00c896; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; }
  .scan-btn:hover { background: #00c896; color: #1a1f2e; }
  .categories { display: flex; gap: 6px; margin-bottom: 10px; overflow-x: auto; padding-bottom: 4px; }
  .categories::-webkit-scrollbar { height: 0; }
  .cat-btn { background: #252b3b; border: 1px solid #3a4158; border-radius: 16px; padding: 5px 12px; font-size: 12px; color: #9ca3af; cursor: pointer; white-space: nowrap; font-family: 'Inter', sans-serif; transition: all .15s; }
  .cat-btn.active { background: #1e3a2f; border-color: #00c896; color: #00c896; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .product-card { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 10px; cursor: pointer; transition: all .2s; }
  .product-card:hover { border-color: #00c896; transform: translateY(-1px); }
  .product-card.low-stock { border-color: #ff6b6b33; }
  .prod-img { width: 100%; height: 70px; object-fit: cover; border-radius: 6px; margin-bottom: 6px; background: #1e2438; display: flex; align-items: center; justify-content: center; font-size: 28px; }
  .prod-img img { width: 100%; height: 70px; object-fit: cover; border-radius: 6px; }
  .product-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; line-height: 1.3; }
  .product-cat { font-size: 10px; color: #6b7280; margin-bottom: 6px; }
  .product-price { font-size: 14px; font-weight: 700; color: #00c896; font-family: monospace; }
  .product-unit { font-size: 10px; color: #9ca3af; }
  .product-stock { font-size: 10px; margin-top: 4px; }
  .stock-ok { color: #6b7280; }
  .stock-low { color: #ff6b6b; }
  .type-badge { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 4px; font-weight: 600; margin-bottom: 4px; }
  .type-unit { background: #1e3a5f; color: #60a5fa; }
  .type-kg { background: #3a2a1e; color: #fb923c; }

  /* Cart */
  .cart { background: #1e2438; border-top: 1px solid #2a3045; display: flex; flex-direction: column; max-height: 340px; }
  .cart-header { padding: 10px 14px; border-bottom: 1px solid #2a3045; display: flex; align-items: center; justify-content: space-between; }
  .cart-header h2 { font-size: 14px; font-weight: 600; }
  .badge { background: #00c896; color: #1a1f2e; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 99px; }
  .cart-items { flex: 1; overflow-y: auto; padding: 8px; }
  .cart-empty { text-align: center; color: #6b7280; padding: 16px; font-size: 12px; }
  .cart-item { background: #252b3b; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; border: 1px solid #3a4158; }
  .cart-item.highlight { border-color: #00c896; box-shadow: 0 0 10px rgba(0,200,150,.15); }
  .cart-item-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
  .cart-item-controls { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
  .qty-btn { width: 24px; height: 24px; border: 1px solid #3a4158; background: #1e2438; border-radius: 5px; cursor: pointer; color: #e8eaf0; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all .15s; }
  .qty-btn:hover { background: #00c896; border-color: #00c896; color: #1a1f2e; }
  .qty-input { width: 52px; background: #1e2438; border: 1px solid #3a4158; border-radius: 5px; padding: 2px 4px; color: #e8eaf0; font-size: 12px; text-align: center; font-family: monospace; outline: none; }
  .qty-input:focus { border-color: #00c896; }
  .item-subtotal { margin-left: auto; font-size: 12px; font-weight: 600; color: #00c896; font-family: monospace; }
  .del-btn { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 13px; padding: 1px; transition: color .15s; }
  .del-btn:hover { color: #ff6b6b; }
  .cart-footer { padding: 10px 14px; border-top: 1px solid #2a3045; }
  .total-line { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
  .total-label { color: #9ca3af; }
  .grand-total { font-size: 18px; font-weight: 700; color: #00c896; font-family: monospace; }
  .pay-btn { width: 100%; padding: 10px; background: linear-gradient(135deg, #00c896, #00a87a); border: none; border-radius: 8px; color: #1a1f2e; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 8px; font-family: 'Inter', sans-serif; }
  .pay-btn:disabled { opacity: .4; cursor: not-allowed; }
  .clear-btn { width: 100%; padding: 6px; background: transparent; border: 1px solid #3a4158; border-radius: 6px; color: #6b7280; font-size: 12px; cursor: pointer; margin-top: 4px; font-family: 'Inter', sans-serif; }
  .clear-btn:hover { border-color: #ff6b6b; color: #ff6b6b; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); display: flex; align-items: flex-end; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
  .modal { background: #1e2438; border: 1px solid #3a4158; border-radius: 20px 20px 0 0; padding: 24px 20px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
  .modal h2 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
  .modal-section { margin-bottom: 14px; }
  .modal-label { font-size: 11px; color: #9ca3af; margin-bottom: 5px; font-weight: 500; letter-spacing: .5px; text-transform: uppercase; }
  .modal-input { width: 100%; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 9px 11px; color: #e8eaf0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; }
  .modal-input:focus { border-color: #00c896; }
  .pay-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .pay-method { padding: 9px; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; cursor: pointer; text-align: center; font-size: 12px; font-weight: 500; transition: all .15s; font-family: 'Inter', sans-serif; color: #e8eaf0; }
  .pay-method.selected { background: #1e3a2f; border-color: #00c896; color: #00c896; }
  .change-box { background: #252b3b; border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
  .change-amount { font-size: 18px; font-weight: 700; font-family: monospace; }
  .change-ok { color: #00c896; }
  .change-short { color: #ff6b6b; }
  .modal-actions { display: flex; gap: 8px; margin-top: 16px; }
  .btn-primary { flex: 1; padding: 11px; background: linear-gradient(135deg, #00c896, #00a87a); border: none; border-radius: 8px; color: #1a1f2e; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-secondary { padding: 11px 14px; background: transparent; border: 1px solid #3a4158; border-radius: 8px; color: #9ca3af; font-size: 14px; cursor: pointer; font-family: 'Inter', sans-serif; }

  /* Image upload */
  .img-upload { width: 100%; height: 90px; background: #252b3b; border: 2px dashed #3a4158; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; gap: 4px; transition: border-color .15s; }
  .img-upload:hover { border-color: #00c896; }
  .img-upload span { font-size: 11px; color: #6b7280; }
  .img-preview { width: 100%; height: 90px; object-fit: cover; border-radius: 8px; cursor: pointer; }

  /* Scanner */
  .scanner-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.85); display: flex; align-items: flex-end; justify-content: center; z-index: 300; }
  .scanner-box { background: #1e2438; border-radius: 20px 20px 0 0; padding: 20px; width: 100%; max-width: 420px; }
  .scanner-box h2 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .scanner-box p { font-size: 12px; color: #9ca3af; margin-bottom: 12px; }
  #scanner-viewport { width: 100%; border-radius: 10px; overflow: hidden; background: #000; min-height: 200px; position: relative; }
  #scanner-viewport video { width: 100%; border-radius: 10px; display: block; }
  .scan-status { margin-top: 10px; text-align: center; font-size: 13px; color: #9ca3af; min-height: 20px; }
  .scan-status.found { color: #00c896; font-weight: 600; }
  .scan-status.notfound { color: #ff6b6b; }
  .scan-manual { margin-top: 10px; }
  .scan-manual input { width: 100%; background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 9px 11px; color: #e8eaf0; font-size: 14px; outline: none; font-family: monospace; }
  .scan-manual input:focus { border-color: #00c896; }
  .scan-actions { display: flex; gap: 8px; margin-top: 12px; }

  /* Success */
  .success-icon { font-size: 44px; text-align: center; margin-bottom: 10px; }
  .success-details { background: #252b3b; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; }
  .success-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
  .success-row:last-child { margin-bottom: 0; font-weight: 700; color: #00c896; }

  /* Inventory */
  .inv-area { flex: 1; overflow-y: auto; padding: 12px; }
  .inv-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .inv-table th { text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; border-bottom: 1px solid #2a3045; }
  .inv-table td { padding: 8px 10px; border-bottom: 1px solid #2a3045; }
  .inv-table tr:hover td { background: #252b3b; }
  .btn-add { background: linear-gradient(135deg, #00c896, #00a87a); border: none; border-radius: 8px; padding: 8px 14px; color: #1a1f2e; font-weight: 700; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; }
  .btn-edit { background: #252b3b; border: 1px solid #3a4158; border-radius: 5px; padding: 4px 8px; color: #9ca3af; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; margin-right: 3px; }
  .btn-del { background: transparent; border: none; border-radius: 5px; padding: 4px 8px; color: #6b7280; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-del:hover { color: #ff6b6b; }
  .select-input { background: #252b3b; border: 1px solid #3a4158; border-radius: 8px; padding: 9px 11px; color: #e8eaf0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; width: 100%; }

  /* History */
  .hist-area { flex: 1; overflow-y: auto; padding: 12px; }
  .hist-item { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
  .hist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .hist-id { font-size: 11px; color: #6b7280; font-family: monospace; }
  .hist-total { font-size: 15px; font-weight: 700; color: #00c896; font-family: monospace; }
  .hist-meta { font-size: 11px; color: #9ca3af; margin-bottom: 6px; }
  .hist-products { font-size: 11px; color: #9ca3af; }

  /* Reports */
  .rep-area { flex: 1; overflow-y: auto; padding: 12px; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .stat-card { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 12px; }
  .stat-label { font-size: 11px; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .4px; }
  .stat-value { font-size: 20px; font-weight: 700; font-family: monospace; }
  .stat-green { color: #00c896; }
  .stat-blue { color: #60a5fa; }
  .stat-orange { color: #fb923c; }
  .rep-section { background: #252b3b; border: 1px solid #3a4158; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
  .rep-section h3 { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
  .rep-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #2a3045; font-size: 12px; }
  .rep-row:last-child { border-bottom: none; }
  .bar { height: 5px; background: #3a4158; border-radius: 3px; margin-top: 3px; }
  .bar-fill { height: 5px; background: linear-gradient(90deg, #00c896, #00a87a); border-radius: 3px; }
`;

function ScannerModal({ products, onFound, onClose }) {
  const [status, setStatus] = useState("Iniciando cámara...");
  const [statusType, setStatusType] = useState("");
  const [manualCode, setManualCode] = useState("");
  const html5QrRef = useRef(null);

  useEffect(() => {
    const loadAndStart = async () => {
      if (!window.Html5Qrcode) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js";
          script.onload = resolve; script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      try {
        const scanner = new window.Html5Qrcode("scanner-viewport");
        html5QrRef.current = scanner;
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 120 } },
          (code) => handleCode(code), () => {});
        setStatus("Apunta al código de barras");
      } catch {
        setStatus("No se pudo acceder a la cámara. Ingresa el código manualmente.");
        setStatusType("notfound");
      }
    };
    loadAndStart();
    return () => { if (html5QrRef.current) html5QrRef.current.stop().catch(() => {}); };
  }, []);

  const handleCode = (code) => {
    const found = products.find(p => p.barcode === code);
    if (found) {
      setStatus(`✓ ${found.name}`);
      setStatusType("found");
      setTimeout(() => { if (html5QrRef.current) html5QrRef.current.stop().catch(() => {}); onFound(found); }, 600);
    } else {
      setStatus(`Código ${code} no registrado`);
      setStatusType("notfound");
    }
  };

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div className="scanner-box" onClick={e => e.stopPropagation()}>
        <h2>📷 Escanear código</h2>
        <p>Enfoca el código o ingrésalo manualmente</p>
        <div id="scanner-viewport" />
        <div className={`scan-status ${statusType}`}>{status}</div>
        <div className="scan-manual">
          <input value={manualCode} onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCode(manualCode.trim())}
            placeholder="Código de barras..." />
        </div>
        <div className="scan-actions">
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleCode(manualCode.trim())}>Buscar</button>
        </div>
      </div>
    </div>
  );
}

function KgModal({ product, onConfirm, onClose }) {
  const [kg, setKg] = useState("");
  const total = (parseFloat(kg) || 0) * (product?.price || 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚖️ Venta por peso</h2>
        <div style={{ background: "#252b3b", borderRadius: 8, padding: 10, marginBottom: 14 }}>
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

function PayModal({ total, onConfirm, onClose }) {
  const [method, setMethod] = useState("Efectivo");
  const [received, setReceived] = useState("");
  const change = method === "Efectivo" ? (parseFloat(received) || 0) - total : 0;
  const methods = ["Efectivo", "Débito", "Crédito", "Transferencia"];
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
          <div className="pay-methods">{methods.map(m => <button key={m} className={`pay-method${method === m ? " selected" : ""}`} onClick={() => setMethod(m)}>{m}</button>)}</div>
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

function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState(product || { name: "", category: "Básicos", type: "unit", price: "", stock: "", unit: "pza", barcode: "", img: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fileRef = useRef();

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("img", reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{product ? "Editar producto" : "Nuevo producto"}</h2>
        <div className="modal-section">
          <div className="modal-label">Foto del producto</div>
          <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={handleImg} />
          {form.img
            ? <img src={form.img} className="img-preview" onClick={() => fileRef.current.click()} alt="producto" />
            : <div className="img-upload" onClick={() => fileRef.current.click()}><span style={{ fontSize: 24 }}>📷</span><span>Toca para agregar foto</span></div>}
        </div>
        <div className="modal-section">
          <div className="modal-label">Nombre</div>
          <input className="modal-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Nombre del producto" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="modal-section">
            <div className="modal-label">Categoría</div>
            <select className="select-input" value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.filter(c => c !== "Todas").map(c => <option key={c}>{c}</option>)}
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
        <div className="modal-section">
          <div className="modal-label">Código de barras</div>
          <input className="modal-input" value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder="Ej: 7790070010015" style={{ fontFamily: "monospace" }} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => { if (form.name && form.price) onSave({ ...form, price: parseFloat(form.price), stock: parseFloat(form.stock) || 0, id: product?.id || Date.now() }); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ sale, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: "center" }}>
        <div className="success-icon">✅</div>
        <h2 style={{ marginBottom: 14 }}>¡Venta registrada!</h2>
        <div className="success-details">
          <div className="success-row"><span>Folio</span><span style={{ fontFamily: "monospace" }}>{sale.id}</span></div>
          <div className="success-row"><span>Método</span><span>{sale.method}</span></div>
          {sale.method === "Efectivo" && <><div className="success-row"><span>Recibido</span><span>{fmt(sale.received)}</span></div><div className="success-row"><span>Vuelto</span><span>{fmt(sale.change)}</span></div></>}
          <div className="success-row"><span>Total</span><span>{fmt(sale.total)}</span></div>
        </div>
        <button className="btn-primary" onClick={onClose} style={{ width: "100%" }}>Nueva venta</button>
      </div>
    </div>
  );
}

function SaleView({ products, setProducts, history, setHistory }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const [cart, setCart] = useState([]);
  const [kgModal, setKgModal] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);

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

  const handleProductClick = (p) => { if (p.type === "kg") setKgModal(p); else addToCart(p, 1); };
  const handleScanFound = (p) => { setScannerOpen(false); handleProductClick(p); };
  const updateQty = (id, val) => { const n = parseFloat(val); if (isNaN(n) || n <= 0) return setCart(c => c.filter(i => i.id !== id)); setCart(c => c.map(i => i.id === id ? { ...i, qty: n } : i)); };
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handlePay = (method, received, change) => {
    const sale = { id: `V-${Date.now()}`, method, received, change, total, items: cart, date: new Date().toISOString() };
    setHistory(h => [sale, ...h]);
    setProducts(ps => ps.map(p => { const item = cart.find(i => i.id === p.id); return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p; }));
    setCart([]); setPayModal(false); setSuccessModal(sale);
  };

  return (
    <div className="content">
      {scannerOpen && <ScannerModal products={products} onFound={handleScanFound} onClose={() => setScannerOpen(false)} />}
      {kgModal && <KgModal product={kgModal} onConfirm={kg => { addToCart(kgModal, kg); setKgModal(null); }} onClose={() => setKgModal(null)} />}
      {payModal && <PayModal total={total} onConfirm={handlePay} onClose={() => setPayModal(false)} />}
      {successModal && <SuccessModal sale={successModal} onClose={() => setSuccessModal(null)} />}
      <div className="products-area">
        <div className="search-row">
          <div className="search-box"><span className="search-icon">🔍</span><input placeholder="Nombre o código..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="scan-btn" onClick={() => setScannerOpen(true)}>📷 Scan</button>
        </div>
        <div className="categories">{CATEGORIES.map(c => <button key={c} className={`cat-btn${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</button>)}</div>
        <div className="grid">
          {filtered.map(p => (
            <div key={p.id} className={`product-card${p.stock < 3 ? " low-stock" : ""}`} onClick={() => handleProductClick(p)}>
              {p.img ? <div className="prod-img"><img src={p.img} alt={p.name} /></div> : <div className="prod-img">{p.category === "Lácteos" ? "🥛" : p.category === "Bebidas" ? "🥤" : p.category === "Higiene" ? "🧴" : p.category === "Limpieza" ? "🧹" : p.category === "Frutas y Verd." ? "🥦" : "📦"}</div>}
              <span className={`type-badge ${p.type === "kg" ? "type-kg" : "type-unit"}`}>{p.type === "kg" ? "⚖️ kg" : "📦 unid"}</span>
              <div className="product-name">{p.name}</div>
              <div className="product-cat">{p.category}</div>
              <div className="product-price">{fmt(p.price)}</div>
              <div className="product-unit">por {p.unit}</div>
              <div className={`product-stock ${p.stock < 3 ? "stock-low" : "stock-ok"}`}>Stock: {p.stock} {p.unit}</div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: "#6b7280", fontSize: 12, gridColumn: "1/-1", padding: 16 }}>No se encontraron productos</div>}
        </div>
      </div>
      <div className="cart">
        <div className="cart-header"><h2>🛒 Carrito</h2>{cart.length > 0 && <span className="badge">{cart.length}</span>}</div>
        <div className="cart-items">
          {cart.length === 0 && <div className="cart-empty">Tocá un producto para agregarlo</div>}
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

function InventoryView({ products, setProducts }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search)));
  const handleSave = (p) => { setProducts(ps => ps.find(x => x.id === p.id) ? ps.map(x => x.id === p.id ? p : x) : [...ps, p]); setModal(null); };
  return (
    <div className="content">
      {modal && <ProductModal product={modal === "new" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      <div className="inv-area">
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div className="search-box" style={{ flex: 1 }}><span className="search-icon">🔍</span><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn-add" onClick={() => setModal("new")}>+ Nuevo</button>
        </div>
        <table className="inv-table">
          <thead><tr><th>Foto</th><th>Producto</th><th>Tipo</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.img ? <img src={p.img} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} alt="" /> : <span style={{ fontSize: 20 }}>{p.category === "Lácteos" ? "🥛" : p.category === "Bebidas" ? "🥤" : p.category === "Higiene" ? "🧴" : p.category === "Limpieza" ? "🧹" : "📦"}</span>}</td>
                <td style={{ fontWeight: 500 }}>{p.name}<br /><span style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>{p.barcode || "—"}</span></td>
                <td><span className={`type-badge ${p.type === "kg" ? "type-kg" : "type-unit"}`}>{p.type === "kg" ? "kg" : "unid"}</span></td>
                <td style={{ fontFamily: "monospace", color: "#00c896" }}>{fmt(p.price)}</td>
                <td style={{ color: p.stock < 3 ? "#ff6b6b" : "#e8eaf0" }}>{p.stock} {p.unit}</td>
                <td><button className="btn-edit" onClick={() => setModal(p)}>✏️</button><button className="btn-del" onClick={() => setProducts(ps => ps.filter(x => x.id !== p.id))}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryView({ history }) {
  return (
    <div className="content">
      <div className="hist-area">
        {history.length === 0 && <div style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>Aún no hay ventas</div>}
        {history.map(sale => (
          <div key={sale.id} className="hist-item">
            <div className="hist-header"><span className="hist-id">{sale.id}</span><span className="hist-total">{fmt(sale.total)}</span></div>
            <div className="hist-meta">📅 {new Date(sale.date).toLocaleString("es-AR")} · 💳 {sale.method}</div>
            <div className="hist-products">{sale.items.map(i => `${i.name} × ${i.qty} ${i.unit}`).join(" · ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsView({ history, products }) {
  const totalVentas = history.reduce((s, v) => s + v.total, 0);
  const totalItems = history.reduce((s, v) => s + v.items.reduce((ss, i) => ss + i.qty, 0), 0);
  const methods = history.reduce((acc, v) => { acc[v.method] = (acc[v.method] || 0) + v.total; return acc; }, {});
  const topProducts = Object.values(history.flatMap(v => v.items).reduce((acc, i) => { acc[i.id] = acc[i.id] || { name: i.name, total: 0 }; acc[i.id].total += i.price * i.qty; return acc; }, {})).sort((a, b) => b.total - a.total).slice(0, 5);
  const maxTop = topProducts[0]?.total || 1;
  return (
    <div className="content">
      <div className="rep-area">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Ventas totales</div><div className="stat-value stat-green">{fmt(totalVentas)}</div></div>
          <div className="stat-card"><div className="stat-label">Transacciones</div><div className="stat-value stat-blue">{history.length}</div></div>
          <div className="stat-card"><div className="stat-label">Artículos vendidos</div><div className="stat-value stat-orange">{totalItems.toFixed(1)}</div></div>
          <div className="stat-card"><div className="stat-label">Ticket promedio</div><div className="stat-value stat-green">{fmt(history.length ? totalVentas / history.length : 0)}</div></div>
          <div className="stat-card"><div className="stat-label">Productos</div><div className="stat-value stat-blue">{products.length}</div></div>
          <div className="stat-card"><div className="stat-label">Stock bajo</div><div className="stat-value" style={{ color: "#ff6b6b" }}>{products.filter(p => p.stock < 3).length}</div></div>
        </div>
        <div className="rep-section">
          <h3>💳 Por método de pago</h3>
          {Object.keys(methods).length === 0 && <div style={{ color: "#6b7280", fontSize: 12 }}>Sin datos aún</div>}
          {Object.entries(methods).map(([m, v]) => <div key={m} className="rep-row"><span>{m}</span><span style={{ fontFamily: "monospace", color: "#00c896" }}>{fmt(v)}</span></div>)}
        </div>
        <div className="rep-section">
          <h3>🏆 Top 5 productos</h3>
          {topProducts.length === 0 && <div style={{ color: "#6b7280", fontSize: 12 }}>Sin datos aún</div>}
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
          {products.filter(p => p.stock < 3).length === 0 && <div style={{ color: "#6b7280", fontSize: 12 }}>Todo el stock está bien ✓</div>}
          {products.filter(p => p.stock < 3).map(p => <div key={p.id} className="rep-row"><span>{p.name}</span><span style={{ color: "#ff6b6b" }}>{p.stock} {p.unit}</span></div>)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("sale");
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [history, setHistory] = useState([]);
  const navItems = [
    { id: "sale", icon: "🛒", label: "Venta" },
    { id: "inventory", icon: "📦", label: "Inventario" },
    { id: "history", icon: "📋", label: "Historial" },
    { id: "reports", icon: "📊", label: "Reportes" },
  ];
  const titles = { sale: "Mi POS 2", inventory: "Inventario", history: "Historial", reports: "Reportes" };
  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="sidebar-desktop">
          <div className="sd-logo">PV</div>
          {navItems.map(n => <button key={n.id} className={`sd-btn${view === n.id ? " active" : ""}`} onClick={() => setView(n.id)}>{n.icon}<span className="tip">{n.label}</span></button>)}
        </nav>
        <div className="main">
          <div className="top-header">
            <div className="logo">PV</div>
            <h1>{titles[view]}</h1>
            <span className="date">{new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</span>
          </div>
          {view === "sale" && <SaleView products={products} setProducts={setProducts} history={history} setHistory={setHistory} />}
          {view === "inventory" && <InventoryView products={products} setProducts={setProducts} />}
          {view === "history" && <HistoryView history={history} />}
          {view === "reports" && <ReportsView history={history} products={products} />}
        </div>
        <nav className="bottom-nav">
          {navItems.map(n => <button key={n.id} className={`bn-btn${view === n.id ? " active" : ""}`} onClick={() => setView(n.id)}><span className="bn-icon">{n.icon}</span>{n.label}</button>)}
        </nav>
      </div>
    </>
  );
}
