import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.runnerbox.dev",
  integrations: [sitemap()],
  markdown: { syntaxHighlight: false },
});
