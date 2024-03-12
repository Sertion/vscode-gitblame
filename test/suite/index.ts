import { resolve } from "node:path";
import { opendir } from "node:fs/promises";

import * as Mocha from "mocha";

export async function run(): Promise<void> {
	const mocha = new Mocha({
		ui: "tdd",
		color: true,
	});

	const files = await opendir(__dirname);

	for await (const dirent of files) {
		if (
			dirent.isFile() &&
			(dirent.name.endsWith(".test.js") || dirent.name.endsWith(".test.js"))
		) {
			mocha.addFile(resolve(__dirname, dirent.name));
		}
	}

	return new Promise((resolvePromise, reject): void => {
		mocha.run((failures): void => {
			if (failures > 0) {
				reject(new Error(`${failures} tests failed.`));
			} else {
				resolvePromise();
			}
		});
	});
}
