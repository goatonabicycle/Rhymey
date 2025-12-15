import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: ".",
  runner: {
    startUrls: ["https://en.wikipedia.org/wiki/Portal:Current_events"],
  },
  manifest: {
    name: "Rhymey",
    short_name: "Rhymey",
    description: "Get rhymes for double-clicked words, even in Google Docs!",
    version: "4.0.1",
    permissions: ["storage"],
    icons: {
      16: "icons/icon16.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
    },
    browser_specific_settings: {
      gecko: {
        id: "rhymey@rhymey.com",
      },
    },
  },
});
