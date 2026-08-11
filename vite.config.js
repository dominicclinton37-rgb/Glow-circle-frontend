import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" keeps asset paths relative so this works whether it's served
// from a GitHub Pages project site (username.github.io/repo-name/) or any
// other subpath, without needing to hardcode the repo name here.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
