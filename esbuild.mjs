import { build } from "esbuild";

const result = await build({
	entryPoints: ["./src/index.ts"],
	bundle: true,
	format: "esm",
	minify: true,
	target: "node22.22",
	outdir: "./out/src/",
	sourcemap: !!process.env.SOURCEMAPS,
	metafile: !!process.env.METAFILE,
	splitting: true,
	external: ["vscode", "node:*"],
});

// Set METAFILE=1 to export a bundle analyze file for esbuild
// Look at it here: https://esbuild.github.io/analyze/
if (result.metafile) {
	await import("node:fs/promises").then(({ writeFile }) => {
		writeFile(
			new URL("./meta.json", import.meta.url),
			JSON.stringify(result.metafile),
		);
	});
}
