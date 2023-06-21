import { resolve } from "path";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
	try {
		// Download VS Code, unzip it and run the integration test
		const exitCode = await runTests({
			extensionDevelopmentPath: resolve(__dirname, ".."),
			extensionTestsPath: resolve(__dirname, "suite", "index.mjs"),
			launchArgs: ["--disable-extensions"],
		});

		if (exitCode !== 0) {
			process.exit(1);
		}
	} catch (err) {
		process.exit(1);
	}

	process.exit(0);
}

main();
