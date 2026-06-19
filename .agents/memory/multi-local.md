---
name: Multi-local architecture
description: How store-location (local) separation is implemented in Mi POS
---

## Rule
All Firestore data is scoped under `locals/{localId}/` — never use flat top-level collections for business data.

**Collections per local:**
- `locals/{localId}/products/{productId}`
- `locals/{localId}/sales/{saleId}`
- `locals/{localId}/settings/categories` (single doc)

**Global collections (no local prefix):**
- `users/{uid}` — user profiles and permissions

## Why
The app supports multiple physical store locations. Each local must have completely isolated inventory, sales, and category data.

## How to apply
- Any new collection that is "per store" must go under `locals/{localId}/...`
- Use `const localId = useContext(LocalCtx)` in any component that writes to Firestore
- `LocalCtx` is provided by the App root as `effectiveLocal`:
  - Owner: `activeLocal` state (stored in localStorage, switchable via header dropdown)
  - Collaborator: `userProfile.localId` (assigned by owner in PermissionsView)
- LOCALS constant defines the valid stores: `[{ id: "local1", name: "Local 1" }, { id: "local-godoy-cruz", name: "Local Godoy Cruz" }]`
- Auto-seed of demo products only runs for `local1` on first empty snapshot
