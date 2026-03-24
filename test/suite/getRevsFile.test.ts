import * as assert from "node:assert";
import { join, resolve } from "node:path";
import test, { afterEach, suite, type TestContext } from "node:test";
import { setupCachedGit } from "../../src/git/command/CachedGit.js";
import { getRevsFile } from "../../src/git/command/getRevsFile.js";
import { Logger } from "../../src/logger.js";
import { setupPropertyStore } from "../setupPropertyStore.js";

async function setupMocks(
	t: TestContext,
	executeMock: typeof baseExecuteMock,
): Promise<ReturnType<typeof setupPropertyStore>> {
	t.mock.module("../../src/git/command/execute.js", {
		namedExports: {
			execute: async (_: Promise<string>, args: string[]): Promise<string> =>
				executeMock[args.join(" ") as keyof typeof executeMock] ?? "",
		},
	});
	setupCachedGit();
	return await setupPropertyStore();
}

const FIXTURE_ROOT = resolve(import.meta.dirname, "../fixture/");
const baseExecuteMock = {
	"rev-parse --absolute-git-dir": `${FIXTURE_ROOT}/.git`,
};

suite("Get revs files", () => {
	Logger.createInstance();
	afterEach(() =>
		import("../../src/git/command/CachedGit.js").then(({ git }) => git.clear()),
	);

	test("Default revs file property", async () => {
		await setupPropertyStore();
		assert.strictEqual(await getRevsFile("fileName"), undefined);
	});

	test("Empty revs file property", async (t) => {
		const propertyStore = await setupMocks(t, baseExecuteMock);
		propertyStore.setOverride("revsFile", []);

		assert.strictEqual(await getRevsFile("fileName"), undefined);

		propertyStore.clearOverrides();
	});

	test("Single file revs file property", async (t) => {
		const propertyStore = await setupMocks(t, baseExecuteMock);
		propertyStore.setOverride("revsFile", ["revs-file-01"]);

		assert.deepEqual(
			await getRevsFile("fileName"),
			join(FIXTURE_ROOT, "revs-file-01"),
		);

		propertyStore.clearOverrides();
	});

	test("Multiple file revs file property", async (t) => {
		const propertyStore = await setupMocks(t, baseExecuteMock);
		propertyStore.setOverride("revsFile", ["revs-file-01", "revs-file-02"]);

		assert.strictEqual(
			await getRevsFile("fileName"),
			join(FIXTURE_ROOT, "revs-file-01"),
		);

		propertyStore.clearOverrides();
	});

	test("Multiple file revs file property with first one missing", async (t) => {
		const propertyStore = await setupMocks(t, baseExecuteMock);
		propertyStore.setOverride("revsFile", [
			"revs-file-00-not-there",
			"revs-file-01",
		]);

		assert.strictEqual(
			await getRevsFile("fileName"),
			join(FIXTURE_ROOT, "revs-file-01"),
		);

		propertyStore.clearOverrides();
	});
});
