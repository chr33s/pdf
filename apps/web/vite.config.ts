import { defineConfig } from "vite";
import { sharedPlugins, sharedResolve, sharedServer } from "./vite.shared-config.js";

export default defineConfig({
  plugins: sharedPlugins,
  resolve: sharedResolve,
  server: sharedServer,
});
