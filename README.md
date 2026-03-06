# TMF637 Product Inventory UI

A React + TypeScript web application providing a full CRUD interface for the
[TMF637 Product Inventory Management API v5](https://www.tmforum.org/resources/specification/tmf637-product-inventory-management-api-rest-specification-r19-0-0/).

The UI connects to a locally-running API server at
`http://localhost:8637/tmf-api/productInventoryManagement/v5`.

---

## Getting started

```bash
npm install
npm run dev        # starts Vite dev server at http://localhost:5173
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build locally
npm run lint       # ESLint
```

---

## Features

- **Product list** — searchable, filterable by status, paginated table
- **Product detail** — read-only view of all product fields and sub-resources
- **Create product** — form with validation for all supported TMF637 fields
- **Edit product** — pre-populated form, PATCH-based update
- **Delete product** — confirmation dialog before deletion
- **Toast notifications** — success and error feedback on every mutation

---

## Architecture

```
src/
├── api/           # Axios HTTP client (one function per API operation)
├── components/
│   ├── ui/        # Reusable low-level UI primitives (Button, Input, Select …)
│   └── Layout.tsx # Top nav + page shell + global Toaster
├── hooks/         # use-toast — module-level toast state with listeners
├── pages/         # One file per route (List, Detail, Form)
├── types/         # TypeScript types derived from the OpenAPI spec
└── lib/           # Shared utilities (cn, formatDate)
```

---

## Dependencies

### Runtime

| Package | Why it was added |
|---|---|
| `react` / `react-dom` | Core UI framework |
| `react-router-dom` | Client-side routing — list, detail, create, edit routes |
| `axios` | HTTP client for the TMF637 API; cleaner than `fetch` for interceptors and typed responses |
| `@tanstack/react-query` | Server-state management — caching, background refetch, loading/error states for every API call |
| `react-hook-form` | Performant form state management; avoids unnecessary re-renders on every keystroke |
| `@hookform/resolvers` | Bridge between react-hook-form and Zod so the schema doubles as both form validation and TS types |
| `zod` | Schema validation for form values; `z.infer<>` derives the TypeScript type so there's a single source of truth |
| `@radix-ui/react-dialog` | Accessible modal dialogs (delete confirmation, product detail modal) |
| `@radix-ui/react-select` | Accessible dropdown select for status, value-type, and party-type fields |
| `@radix-ui/react-label` | Accessible `<label>` correctly linked to its input via `htmlFor` |
| `@radix-ui/react-toast` | Accessible toast notification system for success/error feedback |
| `@radix-ui/react-slot` | `asChild` prop support on Button, enabling composition without extra DOM nodes |
| `@radix-ui/react-separator` | Visual divider in the nav bar |
| `@radix-ui/react-accordion` | Collapsible sections on the product detail page |
| `class-variance-authority` | Type-safe variant system for UI components (e.g. `Button` has `default`, `destructive`, `outline`, `ghost` variants) |
| `clsx` | Conditionally join CSS class strings |
| `tailwind-merge` | Merge Tailwind classes without specificity conflicts — used in the `cn()` helper |
| `lucide-react` | Icon set (consistent, tree-shakeable SVG icons) |

### Dev / build

| Package | Why it was added |
|---|---|
| `vite` | Fast dev server with HMR and optimised production bundler |
| `@vitejs/plugin-react` | Vite plugin enabling React JSX transform and Fast Refresh |
| `tailwindcss` | Utility-first CSS framework |
| `@tailwindcss/vite` | Tailwind v4 Vite plugin — replaces the old PostCSS approach; no `postcss.config.js` needed |
| `typescript` | Static type checking |
| `@types/react` / `@types/react-dom` | TypeScript types for React |
| `@types/node` | TypeScript types for Node.js globals (used in `vite.config.ts` for path aliases) |
| `eslint` | Linter |
| `typescript-eslint` | TypeScript-aware ESLint rules |
| `eslint-plugin-react-hooks` | Enforces the Rules of Hooks |
| `eslint-plugin-react-refresh` | Warns when components aren't Fast Refresh-compatible |
| `@eslint/js` / `globals` | ESLint flat-config helpers |

---

## Notes on Tailwind v4

This project uses **Tailwind CSS v4** via the `@tailwindcss/vite` plugin.
The entry point is `src/index.css` which uses:

```css
@import "tailwindcss";
```

This replaces the v3 PostCSS approach (`@tailwind base/components/utilities`).
Do **not** add a `postcss.config.js` — the Vite plugin handles everything.
