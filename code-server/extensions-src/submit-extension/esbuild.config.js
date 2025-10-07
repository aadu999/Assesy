// esbuild.config.js
const esbuild = require("esbuild")

esbuild
  .build({
    entryPoints: ["extension.js"],
    bundle: true,
    outfile: "dist/extension.js",
    platform: "node",
    // vscode is a runtime dependency provided by the editor, so we exclude it
    external: ["vscode"],
    sourcemap: true,
    minify: true,
  })
  .catch(() => process.exit(1))

console.log("✅ Extension bundled successfully!")
