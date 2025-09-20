# tanstack-start-convex-baml-bun-hello-world

## Guides and Notes

<details>
<summary><strong>Make Native Addons Work in Convex - Fixing the <code>*.node</code> Error</strong></summary>

### Native Modules, Browser Bundlers, and That `.node` Bomb

Convex executes your server code in Node, but your local toolchain (Vite/Bun) still tries to crawl imports as if they might end up in the browser. Native addons like `@boundaryml/baml` ship `.node` binaries; if the bundler touches them, you get “No loader is configured for `.node` files” and deploys fail.

Convex’s bundler respects a project-level escape hatch. Tell it which packages are native and must stay external; the error disappears and your deploy pipeline unblocks.

### The One-Line Shield: `convex.json`

Create a `convex.json` in your repo root to mark BAML as external to Convex’s packer. This prevents the `.node` file from being crawled or rebundled.

```json
{
  "node": {
    "externalPackages": [
      "@boundaryml/baml"
    ]
  }
}
````

Add `"use node"` to any Convex file that imports BAML so it’s compiled for Node contexts only. This keeps it off the client path while allowing Convex to run it on the server.

```ts
// convex/bamlActions.ts
"use node";

import { baml } from "@boundaryml/baml";
// minimal example; call baml inside an action/query as needed
```

If your web build still touches the addon, exclude it in Vite so the browser pre-bundler never chases the native binary during dev/prebundle.

```ts
// vite.config.ts (excerpt)
export default {
  optimizeDeps: {
    exclude: ["@boundaryml/baml"]
  },
  ssr: {
    external: ["@boundaryml/baml"]
  }
};
```

### Sanity Checks That Save Hours

Point your client at the prod URL while your server targets the intended deployment. Mismatched URLs make debugging look like schema or codegen trouble.

```bash
# .env.local (dev defaults)
CONVEX_DEPLOYMENT=adventurous-robin-405
VITE_CONVEX_URL=https://adventurous-robin-405.convex.cloud
```

Use verbose Convex logs to confirm the right deployment, codegen, and the externalization taking effect. If you see `.node` in the log path again, the bundler still isn’t excluding it.

```bash
CONVEX_VERBOSE=1 bunx convex dev --tail-logs always
bunx convex deploy -v
```

### Secrets Belong in `.env`, Not in Code

Deployment names and URLs change; keep them out of source so you can rotate safely and avoid accidental commits. A `.env` file gives clean separation, easy rotation, and prevents leaks in PRs or logs.

```bash
# .env.local
CONVEX_DEPLOYMENT=your-dev-deployment
VITE_CONVEX_URL=https://your-dev-deployment.convex.cloud
```

This layout lets Convex run native-powered actions on the server while your web stack never touches `.node` artifacts. The result: no “Could not find public function…” ghosts from bad bundling, and clean deploys with your new schema.

</details>

---

<details>
<summary><strong>Secrets in the Right Place: Making BAML Work with Convex Deployments</strong></summary>

### Local Files Don’t Travel to Convex Cloud

When you run `bunx convex dev`, Convex pushes your functions into its cloud dev deployment. That runtime does not read your local `.env` or `.env.local`. If your BAML client references `env.GOOGLE_API_KEY`, Convex will happily inject an empty string unless you register the key with the deployment. This is why curl works locally but Convex actions return a 400.

Convex treats secrets as deployment-scoped, not file-scoped. You must explicitly push them up with `convex env`.

### The Fix: Push the Key into Convex

Register the API key against the deployment so Convex functions have it available at runtime. This is a one-time step per deployment.

```bash
# set the key for the current deployment
npx convex env set GOOGLE_API_KEY your-secret-here

# verify it’s stored
npx convex env list
```

Restart your local dev process so it reconnects with the updated environment:

```bash
bunx convex dev
```

Once set, BAML will find the variable inside Convex Cloud and your Gemini calls succeed without a 400.

### Optional: Run Local Only

If you prefer to avoid cloud dev during early testing, run Convex locally so `.env.local` is respected:

```bash
bunx convex dev --local
```

This bypasses the need to sync secrets, though it means you’re not exercising the same environment as production. For most projects, registering secrets with `convex env` is the safer, production-aligned workflow.

</details>
