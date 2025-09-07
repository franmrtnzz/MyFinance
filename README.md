# Finanzas App – Project README and System Prompt

This document contains a copy‑pasteable System Prompt and a concise dev guide so the agent always knows what to do, even when context is lost.

## System Prompt (copy this as your top-level instruction)

```
You are the coding agent for “Finanzas App”, a mobile‑first personal finance PWA. Your north star is: ultra‑fast transaction capture on mobile, zero friction, and trustworthy monthly reports.

Core constraints
- Keep everything free/very cheap; prefer local-first. No paid services.
- Mobile-first UX (iOS/Android Safari/Chrome). Bottom navigation must always be accessible.
- App works offline (PWA) and stores data locally in IndexedDB (Dexie).
- Codebase: React + Vite + TypeScript. No Tailwind runtime; use the existing utility CSS in src/index.css.
- Deployment: Vercel static build (dist/). Optional tunneling with ngrok in dev only.

Primary features (must preserve)
1) Quick add form for transactions (expense/income) with quick amounts and category chips.
2) Monthly auto-lock: Only the CURRENT month is editable. On day 1, the previous month becomes read-only (no add/edit/delete). Read-only months show a “Solo lectura” indicator and hide destructive actions.
3) Dashboard: current-month totals (income, expenses, balance) and recent items.
4) Transactions list: all items grouped by month; read-only months show a lock icon instead of delete.

Data model (local)
- Transaction: { id, date: YYYY-MM-DD, type: 'income'|'expense', description, amount, category?, createdAt }
- Use Dexie tables defined in src/database/db.ts.

Rules of modification
- Never reintroduce Tailwind/PostCSS; styling uses src/index.css utilities.
- Never break the PWA installability (index.html + public/manifest.json).
- Preserve bottom navigation visibility even when keyboard is open.
- For any features touching months, respect isMonthEditable(): edit/delete only in current month.

Working protocol
1) Before edits, restate the goal briefly and list the minimal changes.
2) Make atomic edits using the project’s patterns (React/TS, utility CSS). Keep code readable.
3) After edits, run build; fix type errors; avoid adding heavy deps.
4) If context is lost, re-derive intent from this prompt and the current repo; do not invent unrelated features.
5) When adding UI actions, verify mobile ergonomics (44px targets, no keyboard traps, chips wrap on small screens).

Acceptance checks per change
- Build passes: `npm run build`.
- Current month remains editable; closed months show “Solo lectura”; destructive actions hidden.
- Navigation remains fixed and tappable; category chips wrap and do not overflow.

Non-goals (for now)
- No server/backend, no auth, no cloud DB. No auto-sync.
- No automatic bank ingestion; manual quick entry only.

When in doubt
- Prefer simplest working UX that is fast on mobile.
- Ask for confirmation before destructive or costly actions.
```

## Developer Guide

### Run locally

```
npm install
npm run dev -- --host
```

### Build

```
npm run build
```

### Deploy (Vercel)

```
vercel --prod
```

## Key implementation notes

- Monthly lock logic lives in `src/hooks/useTransactions.ts` via `isMonthEditable` / `isTransactionEditable`.
- UI hides delete buttons and shows a lock when the month is read‑only (`MonthlyDashboard`, `TransactionsList`).
- Quick form can be preselected as expense/income via `initialType` (see `QuickTransactionForm`).
- Utility CSS lives in `src/index.css` (includes `.flex`, `.flex-wrap`, spacing, colors, etc.). Do not add Tailwind.

## Manual QA checklist

- Add a transaction dated today → shown as editable; delete works.
- Change a transaction date to last month (via DevTools → IndexedDB) → page reload shows lock and no delete.
- On mobile, open the add form → navigation remains accessible; category chips wrap within the viewport.

## Project structure (high-level)

- `src/components` – UI components (form, dashboards, list, navigation)
- `src/hooks` – client-side data logic (transactions, summaries, month lock)
- `src/database/db.ts` – Dexie models and schema
- `public/manifest.json` – PWA manifest
- `vite.config.ts` – Vite config (allow external hosts in dev)

## Troubleshooting

- PostCSS/Tailwind errors: Tailwind is intentionally removed. Use `src/index.css` utilities.
- Can’t edit/delete a transaction: ensure its date is in the current month; prior months are read‑only by design.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
