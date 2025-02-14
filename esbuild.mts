import { build } from "esbuild";

await build({
	entryPoints: ["./src/index.ts"],
	bundle: true,
	format: "cjs",
	minify: true,
	target: "node20.9",
	outfile: "./out/src/index.js",
	external: [
		"vscode",
		"node:child_process",
		"node:fs",
		"node:fs/promises",
		"node:path",
		"node:url",
		"node:util",
	],
});
