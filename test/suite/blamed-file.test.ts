import assert from "node:assert";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import test, { after, before, mock, suite } from "node:test";
import type { BlamedFile as BlamedFileType } from "../../src/blamed-file.js";
import type { BlameProcess } from "../../src/git/command/blameProcess.js";
import { setupCachedGit } from "../../src/git/command/CachedGit.js";
import { Logger } from "../../src/logger.js";
import { setupPropertyStore } from "../setupPropertyStore.js";

suite("BlamedFile base cases", async () => {
	let BlamedFile: typeof BlamedFileType;
	before(async () => {
		await setupPropertyStore();
		await setupCachedGit();
		Logger.createInstance();
		mock.module("../../src/git/command/blameProcess.js", {
			namedExports: {
				blameProcess: async (
					_realpathFileName: string,
					_revsFile: string | undefined,
				): Promise<BlameProcess> => ({
					kill: () => true,
					stderr: Readable.from([]),
					stdout: Readable.from(
						await readFile(
							resolve(
								import.meta.dirname,
								"../fixture/git-stream-blame-incremental.chunks",
							),
						),
					),
				}),
			},
			cache: false,
		});
		mock.module("node:fs/promises", {
			namedExports: {
				realpath: () => Promise.resolve("fake-path"),
				access: () => Promise.resolve(),
			},
		});
		BlamedFile = (await import(`../../src/blamed-file.js?${randomUUID()}`))
			.BlamedFile;
	});

	after(() => mock.reset());

	test("createInstance", () => {
		assert.ok(new BlamedFile("") instanceof BlamedFile);
	});

	test("can access filePath", () => {
		const blamed = new BlamedFile("/file");
		assert.strictEqual(blamed.filePath, "/file");
	});

	test("can get blame", async (t) => {
		const blamed = new BlamedFile("/file");

		const blame = await blamed.getBlame();

		assert.ok(blame, "Unable to get blame");
		t.assert.snapshot(Array.from(blame.entries()));
	});

	test("if a blamed file has been disposed the blame should be empty", async () => {
		const blamed = new BlamedFile("/file");
		await blamed.getBlame();
		blamed.dispose();

		assert.strictEqual((await blamed.getBlame())?.size, 0);
	});
});

suite("BlamedFile error cases", async () => {
	let BlamedFile: typeof BlamedFileType;
	before(async () => {
		await setupPropertyStore();
		await setupCachedGit();
		Logger.createInstance();
		mock.module("../../src/git/command/blameProcess.js", {
			namedExports: {
				blameProcess: async (
					_realpathFileName: string,
					_revsFile: string | undefined,
				): Promise<BlameProcess> => ({
					kill: () => true,
					stderr: Readable.from(["error"]),
					stdout: Readable.from([]),
				}),
			},
			cache: false,
		});
		mock.module("node:fs/promises", {
			namedExports: {
				realpath: () => Promise.resolve("fake-path"),
				access: () => Promise.resolve(),
			},
		});
		BlamedFile = (await import(`../../src/blamed-file.js?${randomUUID()}`))
			.BlamedFile;
	});

	after(() => mock.reset());

	test("error during blame should return undefined blame", async () => {
		const blamed = new BlamedFile("/file");
		const blame = await blamed.getBlame();

		assert.strictEqual(blame, undefined);
	});
});
