/**
 * One-off: split TanStack route files into critical (.tsx) + lazy (.lazy.tsx).
 * Run: node scripts/split-route-chunks.mjs
 */
import fs from "node:fs";
import path from "node:path";

const routesDir = path.join(process.cwd(), "src", "routes");

const ROUTES = [
  { file: "_admin.users", path: "/_admin/users", hasSearch: false, hasBeforeLoad: false },
  { file: "_admin.plans", path: "/_admin/plans", hasSearch: false, hasBeforeLoad: false },
  { file: "_admin.metricas", path: "/_admin/metricas", hasSearch: false, hasBeforeLoad: false },
  { file: "_admin.tenants", path: "/_admin/tenants", hasSearch: true, hasBeforeLoad: false },
  { file: "_admin", path: "/_admin", hasSearch: false, hasBeforeLoad: true },
  { file: "_app.pesquisas", path: "/_app/pesquisas", hasSearch: true, hasBeforeLoad: false },
  { file: "_app.configuracoes", path: "/_app/configuracoes", hasSearch: true, hasBeforeLoad: false },
  { file: "_app.relatorios", path: "/_app/relatorios", hasSearch: true, hasBeforeLoad: false },
  { file: "_app.eleitores", path: "/_app/eleitores", hasSearch: true, hasBeforeLoad: false },
  { file: "_app.liderancas", path: "/_app/liderancas", hasSearch: true, hasBeforeLoad: false },
  { file: "_app.demandas", path: "/_app/demandas", hasSearch: true, hasBeforeLoad: false },
];

const pendingImport =
  'import { RoutePendingFallback } from "@/components/common/RoutePendingFallback";\n';

function extractRouteConfigBlock(content) {
  const match = content.match(
    /export const Route = createFileRoute\([^)]+\)\(\{([\s\S]*?)\}\);?\s/,
  );
  if (!match) throw new Error("Route block not found");
  return match[1];
}

function stripComponentFromConfig(configBlock) {
  let block = configBlock;
  block = block.replace(/\n\s*component:\s*\w+,?\s*/g, "\n");
  return block.trim();
}

function buildMainFile(routePath, configBlock) {
  const inner = stripComponentFromConfig(configBlock);
  if (!inner) {
    return `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("${routePath}")({});
`;
  }
  return `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("${routePath}")({
${inner}
});
`;
}

function buildLazyFile(routePath, content, configBlock) {
  let lazy = content;

  lazy = lazy.replace(
    /import \{ createFileRoute(?:,[^}]*)? \} from "@tanstack\/react-router";/,
    'import { createLazyFileRoute, getRouteApi } from "@tanstack/react-router";',
  );

  if (!lazy.includes("RoutePendingFallback")) {
    lazy = lazy.replace(
      /import \{ createLazyFileRoute, getRouteApi \} from "@tanstack\/react-router";\n/,
      `import { createLazyFileRoute, getRouteApi } from "@tanstack/react-router";\n${pendingImport}`,
    );
  }

  lazy = lazy.replace(
    /export const Route = createFileRoute\([^)]+\)\(\{[\s\S]*?\}\);?\s/,
    "",
  );

  const apiName = routePath.replace(/[^a-zA-Z0-9]/g, "_").replace(/^_+/, "routeApi");
  lazy = lazy.replace(/\bRoute\.useSearch\(\)/g, `${apiName}.useSearch()`);
  lazy = lazy.replace(/\bRoute\.useNavigate\(\)/g, `${apiName}.useNavigate()`);

  const componentMatch = configBlock.match(/component:\s*(\w+)/);
  const componentName = componentMatch?.[1] ?? "RouteComponent";

  lazy =
    `const ${apiName} = getRouteApi("${routePath}");\n\n` +
    lazy +
    `\nexport const Route = createLazyFileRoute("${routePath}")({\n  component: ${componentName},\n  pendingComponent: RoutePendingFallback,\n});\n`;

  return lazy;
}

for (const { file, path: routePath } of ROUTES) {
  const mainPath = path.join(routesDir, `${file}.tsx`);
  const lazyPath = path.join(routesDir, `${file}.lazy.tsx`);

  if (!fs.existsSync(lazyPath)) {
    console.warn(`skip missing lazy: ${file}`);
    continue;
  }

  const original = fs.readFileSync(lazyPath, "utf8");
  const configBlock = extractRouteConfigBlock(original);
  const mainContent = buildMainFile(routePath, configBlock);
  const lazyContent = buildLazyFile(routePath, original, configBlock);

  fs.writeFileSync(mainPath, mainContent);
  fs.writeFileSync(lazyPath, lazyContent);
  console.log(`split ${file}`);
}

console.log("done");
