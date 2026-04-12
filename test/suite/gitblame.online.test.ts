import assert from "node:assert";
import { afterEach, before, mock, suite, test } from "node:test";

import type { online as onlineType } from "../../src/gitblame.online.js";
import { getExampleCommit } from "../getExampleCommit.js";

suite("gitblame.online", () => {
	let online: typeof onlineType;
	const infoMessageMock = mock.fn();
	const errorMessageMock = mock.fn();
	const getToolUrlMock = mock.fn<() => Promise<URL | undefined>>(() =>
		Promise.resolve(new URL("")),
	);
	before(async () => {
		mock.module("../../src/message.js", {
			namedExports: {
				infoMessage: infoMessageMock,
				errorMessage: errorMessageMock,
			},
		});
		mock.module("../../src/git/get-tool-url.js", {
			namedExports: { getToolUrl: getToolUrlMock },
		});
		online = (await import("../../src/gitblame.online.js")).online;
	});

	afterEach(() => {
		infoMessageMock.mock.resetCalls();
		errorMessageMock.mock.resetCalls();
		getToolUrlMock.mock.resetCalls();
	});

	test("Without extension it should respond with error", async () => {
		await online(undefined, () => Promise.resolve());

		assert.strictEqual(
			infoMessageMock.mock.callCount(),
			0,
			"infoMessage should not be called",
		);
		assert.strictEqual(
			errorMessageMock.mock.callCount(),
			1,
			"errorMessage should be called",
		);
	});
	test("With extension without url to copy it should respond with error", async () => {
		getToolUrlMock.mock.mockImplementationOnce(() =>
			Promise.resolve(undefined),
		);

		const mockExecuteCommand = mock.fn(() => Promise.resolve());

		await online(
			{ commit: () => Promise.resolve(getExampleCommit()) },
			mockExecuteCommand,
		);

		assert.strictEqual(
			infoMessageMock.mock.callCount(),
			0,
			"infoMessage should not be called",
		);
		assert.strictEqual(
			errorMessageMock.mock.callCount(),
			1,
			"errorMessage should be called",
		);
	});
	test("With extension with commit it should execute the open command", async () => {
		const url = new URL("http://expected.url");
		getToolUrlMock.mock.mockImplementationOnce(() => Promise.resolve(url));

		const mockExecuteCommand = mock.fn((_: string) => Promise.resolve());

		await online(
			{ commit: () => Promise.resolve(getExampleCommit()) },
			mockExecuteCommand,
		);
		assert.strictEqual(
			infoMessageMock.mock.callCount(),
			0,
			"infoMessage should not be called",
		);
		assert.strictEqual(
			errorMessageMock.mock.callCount(),
			0,
			"errorMessage should not be called",
		);
		assert.strictEqual(
			mockExecuteCommand.mock.callCount(),
			1,
			"mockExecuteCommand should be called",
		);
		assert.deepEqual(mockExecuteCommand.mock.calls[0].arguments, [
			"vscode.open",
			url,
		]);
	});
});
