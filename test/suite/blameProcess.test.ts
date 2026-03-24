import * as assert from "node:assert";
import test, { afterEach, before, mock, suite } from "node:test";
import type { blameProcess as blameProcessType } from "../../src/git/command/blameProcess.js";
import { Logger } from "../../src/logger.js";
import { setupPropertyStore } from "../setupPropertyStore.js";

const spawnMock = mock.fn();
function setupMocks(): void {
	mock.module("node:child_process", {
		namedExports: { spawn: spawnMock },
	});
}

suite("blameProcess", async (): Promise<void> => {
	Logger.createInstance();
	const propStore = await setupPropertyStore();
	let blameProcess: typeof blameProcessType;
	before(async () => {
		setupMocks();
		blameProcess = (await import("../../src/git/command/blameProcess.js"))
			.blameProcess;
	});
	afterEach(() => {
		propStore.clearOverrides();
		spawnMock.mock.resetCalls();
	});

	test("most basic case", async (): Promise<void> => {
		await blameProcess("_file_", undefined);

		assert.strictEqual(spawnMock.mock.callCount(), 1);
		assert.deepStrictEqual(spawnMock.mock.calls[0].arguments[1], [
			"blame",
			"--incremental",
			"--",
			"_file_",
		]);
	});

	test("with revFile", async (): Promise<void> => {
		await blameProcess("_file_", "test-rev-file");

		assert.strictEqual(spawnMock.mock.callCount(), 1);
		assert.deepStrictEqual(spawnMock.mock.calls[0].arguments[1], [
			"blame",
			"-S",
			"test-rev-file",
			"--incremental",
			"--",
			"_file_",
		]);
	});

	test("with ignore whitespace", async (): Promise<void> => {
		propStore.setOverride("ignoreWhitespace", true);
		await blameProcess("_file_", undefined);

		assert.strictEqual(spawnMock.mock.callCount(), 1);
		assert.deepStrictEqual(spawnMock.mock.calls[0].arguments[1], [
			"blame",
			"-w",
			"--incremental",
			"--",
			"_file_",
		]);
	});

	test("with detect move or copy from other files (1)", async (): Promise<void> => {
		propStore.setOverride("detectMoveOrCopyFromOtherFiles", 1);
		await blameProcess("_file_", undefined);

		assert.strictEqual(spawnMock.mock.callCount(), 1);
		assert.deepStrictEqual(spawnMock.mock.calls[0].arguments[1], [
			"blame",
			"-C",
			"--incremental",
			"--",
			"_file_",
		]);
	});

	test("with detect move or copy from other files (2)", async (): Promise<void> => {
		propStore.setOverride("detectMoveOrCopyFromOtherFiles", 2);
		await blameProcess("_file_", undefined);

		assert.strictEqual(spawnMock.mock.callCount(), 1);
		assert.deepStrictEqual(spawnMock.mock.calls[0].arguments[1], [
			"blame",
			"-C",
			"-C",
			"--incremental",
			"--",
			"_file_",
		]);
	});
	test("with detect move or copy from other files (3)", async (): Promise<void> => {
		propStore.setOverride("detectMoveOrCopyFromOtherFiles", 3);
		await blameProcess("_file_", undefined);

		assert.strictEqual(spawnMock.mock.callCount(), 1);
		assert.deepStrictEqual(spawnMock.mock.calls[0].arguments[1], [
			"blame",
			"-C",
			"-C",
			"-C",
			"--incremental",
			"--",
			"_file_",
		]);
	});
});
