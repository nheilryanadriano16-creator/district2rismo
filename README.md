# React + Vite

## Deploying the frontend to Vercel

Import the repository into Vercel with the repository root as the project root. The included `vercel.json` configures the Vite build (`npm run build`), output directory (`dist`), and React Router fallback for direct page loads.

Set these frontend environment variables in Vercel for each deployment environment:

- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key (`pk_...`). This value is public in the browser bundle.
- `VITE_PAYMENT_API_URL`: HTTPS base URL for the separately hosted Express API in `server/`.

The Express API is not deployed by this static frontend configuration. Host it separately and configure its `STRIPE_SECRET_KEY`, `FRONTEND_URL` (your Vercel domain), and Firebase Admin credentials as server-side environment variables. Do not put secret keys in variables prefixed with `VITE_`.

The API currently stores uploads on local disk. That storage is not durable for Vercel serverless deployments; use persistent object storage such as Firebase Storage, or host the API on a service with persistent storage. Do not commit uploaded files or environment files. The existing files under `public/uploads/` are excluded from new commits, so migrate any images that must remain available to persistent storage before deploying.

## Development

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
