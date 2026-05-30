// <define:__ROUTES__>
var define_ROUTES_default = { version: 1, description: "Built with @cloudflare/next-on-pages@1.13.16.", include: ["/*"], exclude: ["/_next/static/*"] };

// node_modules/.pnpm/wrangler@4.95.0/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/probob_27/Desktop/projects/ClassOrbit/classorbit-app/.wrangler/tmp/pages-zJU9Cv/bundledWorker-0.8258354498478815.mjs";
import { isRoutingRuleMatch } from "/home/probob_27/Desktop/projects/ClassOrbit/classorbit-app/node_modules/.pnpm/wrangler@4.95.0/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/probob_27/Desktop/projects/ClassOrbit/classorbit-app/.wrangler/tmp/pages-zJU9Cv/bundledWorker-0.8258354498478815.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=a5ba7gko2ag.js.map
