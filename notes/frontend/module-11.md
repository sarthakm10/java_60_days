# Frontend 11 — Modules, npm and Tooling

> **Real frontend projects aren't one script tag.** They're hundreds of files split into modules, with packages from npm, and a build tool that bundles it all for the browser. Think of this as Maven and the JDK, frontend edition. You'll set it up once per project, and then React (Module 15) sits on top.

<!-- subtopic: f11_s1 -->
### ES modules: import and export

A **module** is a file with its own scope: nothing leaks out unless you export it.

```js
// math.js
export const PI = 3.14159;                       // named exports
export function area(r) { return PI * r * r; }

export default function format(n) {              // one default export per file
  return n.toFixed(2);
}
```

```js
// app.js
import format, { area, PI } from "./math.js";    // default first, then named in braces
import { area as circleArea } from "./math.js";  // rename
import * as math from "./math.js";               // everything as one object: math.area

console.log(format(area(2)));                    // "12.57"
```

| | Named export | Default export |
|---|---|---|
| Per file | as many as you like | at most one |
| Import with | the exact name, in braces | any name, no braces |
| Good for | utilities, constants, several things | the file's main thing (a React component) |

In a plain HTML page, opt in with `<script type="module" src="app.js">`: modules are deferred automatically and need to be served over http (Live Server), not opened from `file://`.

You'll also see the older **CommonJS** style in Node code (`const x = require("x")` and `module.exports = …`). New frontend code uses `import`/`export`.

<details>
<summary>Named or default export: which needs braces when importing?</summary>

Named exports are imported in braces with their exact names: `import { area } from "./math.js"`. A default export is imported without braces, under any name you choose: `import format from "./math.js"`.
</details>

<!-- subtopic: f11_s2 -->
### Node.js and npm

**Node.js** runs JavaScript outside the browser. Frontend developers need it for the tools, even if the app itself runs in the browser. Install the LTS version; it comes with **npm**, the package manager (like Maven Central plus the `mvn` command).

```bash
node --version
npm init -y                     # creates package.json
npm install axios               # a runtime dependency
npm install -D vitest           # a dev dependency (tools, tests)
npm uninstall axios
npm run dev                     # runs the "dev" script from package.json
npx some-tool                   # runs a package's command without installing it globally
```

`package.json` is the project file (like `pom.xml`):

```json
{
  "name": "task-ui",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": { "react": "^19.0.0", "axios": "^1.7.0" },
  "devDependencies": { "vite": "^6.0.0", "vitest": "^2.1.0" }
}
```

| File / folder | What it is | Commit it? |
|---|---|---|
| `package.json` | your dependencies (with version ranges) and scripts | yes |
| `package-lock.json` | the **exact** versions installed, so every machine gets the same | yes |
| `node_modules/` | the downloaded packages (often huge) | **no**: add it to `.gitignore` |

Version ranges: `^1.7.0` allows any 1.x from 1.7.0 up (no major changes); `~1.7.0` allows only 1.7.x patches. After cloning a project, `npm install` (or `npm ci` on CI servers, which installs exactly the lock file) recreates `node_modules`.

Alternatives you'll see: **pnpm** and **yarn** (same idea, different speed and disk use).

<details>
<summary>Why commit package-lock.json but not node_modules?</summary>

The lock file pins the exact version of every package, so everyone and the CI server install identical dependencies. node_modules can be rebuilt from it with `npm install`, and it's huge and platform-specific.
</details>

<!-- subtopic: f11_s3 -->
### Bundlers and dev servers: what Vite does

Browsers can load modules directly, but a real project needs more: npm packages imported by name (`import React from "react"`), JSX and TypeScript turned into plain JavaScript, CSS imports, and a small, fast production build.

**Vite** is the standard tool for new projects:

```bash
npm create vite@latest task-ui -- --template react-ts    # React + TypeScript starter
cd task-ui
npm install
npm run dev          # dev server at http://localhost:5173 with instant hot reload
npm run build        # production build in dist/
npm run preview      # serve dist/ locally to check the build
```

| In development (`npm run dev`) | For production (`npm run build`) |
|---|---|
| serves files as they are, transforming each on request: starts in milliseconds | **bundles** everything into a few files |
| hot module replacement: edits show without losing page state | **minifies** (removes spaces, shortens names) |
| readable code, source maps | **tree-shakes** (drops unused exports) and splits code into chunks |
| | adds content hashes to filenames (`index-a1b2c3.js`) for long-term caching |

The `dist/` folder is plain static files you can deploy anywhere (Vercel, Netlify, S3, or even Spring Boot's `static/` folder).

Older tools you'll meet in existing projects: **webpack** (powerful, more configuration) and **Create React App** (deprecated; don't start new projects with it). Next.js has its own build (Module 22).

<details>
<summary>Why build for production instead of shipping the source files?</summary>

The build bundles and minifies the code, removes unused parts, converts JSX/TypeScript to JavaScript and adds hashed filenames for caching, so users download far fewer and smaller files that the browser can actually run.
</details>

<!-- subtopic: f11_s4 -->
### ESLint and Prettier

Two tools almost every team runs:

| Tool | Job | Example catch |
|---|---|---|
| **ESLint** | finds likely bugs and bad patterns | an unused variable, `==` instead of `===`, a missing hook dependency |
| **Prettier** | formats code the same way for everyone | quotes, semicolons, line breaks |

```bash
npm install -D eslint prettier
npx eslint .            # report problems
npx prettier --write .  # reformat every file
```

Vite's React template comes with an ESLint config, including the React Hooks rules that catch real bugs (Module 18). Set up VS Code to format on save and show ESLint warnings inline, and many mistakes never reach the browser. Teams often add a **pre-commit hook** (husky + lint-staged) so unformatted or failing code can't be committed.

It's the same idea as Checkstyle and SpotBugs in Java, but the frontend world uses them much more widely.

<details>
<summary>ESLint or Prettier: which one would catch a variable you declared but never used?</summary>

ESLint (the no-unused-vars rule). Prettier only changes formatting and never reports logic problems.
</details>

<!-- subtopic: f11_s5 -->
### Environment variables in frontend apps

Your API address differs between your laptop and production. Vite reads `.env` files:

```bash
# .env.development
VITE_API_URL=http://localhost:8080/api

# .env.production
VITE_API_URL=https://api.mytasks.com/api
```

```js
const API = import.meta.env.VITE_API_URL;
```

Only variables starting with `VITE_` are exposed to your code, and they're **inlined into the JavaScript at build time**.

That last point is the big rule: **everything in a frontend build is public.** Anyone can open DevTools and read your JavaScript, including every environment variable in it. So:

- ✅ API base URLs, public analytics IDs, feature flags.
- ❌ Database passwords, secret API keys, JWT signing secrets, payment secret keys.

Secrets belong on your **backend** (Spring Boot's `application.yml` and environment variables). If the frontend needs to call a paid third-party API, it calls *your* backend, which adds the secret key and forwards the request.

Commit `.env.example` with placeholder values; keep real `.env` files with anything sensitive out of Git.

<details>
<summary>Can you safely put a secret API key in VITE_SECRET_KEY?</summary>

No. Vite inlines it into the JavaScript bundle that every user downloads, so anyone can read it. Keep secrets on the server and have the frontend call your backend instead.
</details>

## 📝 Module 11 Recap

1. What's a module? → **a file with its own scope that shares only what it exports**
2. Named vs default export? → **named: many per file, imported in braces; default: one per file, any name**
3. What is npm? → **Node's package manager: installs packages and runs scripts from package.json**
4. dependencies vs devDependencies? → **needed at runtime vs only for building and testing**
5. Commit node_modules? → **no; commit package.json and package-lock.json**
6. What does Vite give you? → **a fast dev server with hot reload and an optimised production build**
7. Three things a production build does? → **bundles, minifies, tree-shakes (plus hashed filenames)**
8. ESLint vs Prettier? → **ESLint finds bugs and bad patterns; Prettier formats**
9. Which env variables does Vite expose? → **only those starting with VITE_, inlined at build time**
10. Where do secrets go? → **on the backend, never in the frontend bundle**
