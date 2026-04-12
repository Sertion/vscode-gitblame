import assert from "node:assert";
import { afterEach, before, mock, suite, test } from "node:test";

import type { addToolUrlToClipboard as addToolUrlToClipboardType } from "../../src/gitblame.addToolUrlToClipboard.js";
import { getExampleCommit } from "../getExampleCommit.js";

suite("gitblame.addToolUrlToClipboard", () => {
	let addToolUrlToClipboard: typeof addToolUrlToClipboardType;
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
		addToolUrlToClipboard = (
			await import("../../src/gitblame.addToolUrlToClipboard.js")
		).addToolUrlToClipboard;
	});

	afterEach(() => {
		infoMessageMock.mock.resetCalls();
		errorMessageMock.mock.resetCalls();
		getToolUrlMock.mock.resetCalls();
	});

	test("Without extension it should respond with error", async () => {
		await addToolUrlToClipboard(undefined, () => Promise.resolve());

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

		const mockClipboard = mock.fn(() => Promise.resolve());

		await addToolUrlToClipboard(
			{ commit: () => Promise.resolve(getExampleCommit()) },
			mockClipboard,
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
	test("With extension with commit it should respond with info and add to clipboard", async () => {
		const url = new URL("http://expected.url");
		getToolUrlMock.mock.mockImplementationOnce(() => Promise.resolve(url));

		const mockClipboard = mock.fn((_: string) => Promise.resolve());

		await addToolUrlToClipboard(
			{ commit: () => Promise.resolve(getExampleCommit()) },
			mockClipboard,
		);
		assert.strictEqual(
			infoMessageMock.mock.callCount(),
			1,
			"infoMessage should be called",
		);
		assert.strictEqual(
			errorMessageMock.mock.callCount(),
			0,
			"errorMessage should not be called",
		);
		assert.strictEqual(
			mockClipboard.mock.callCount(),
			1,
			"mockClipboard should be called",
		);
		assert.strictEqual(
			mockClipboard.mock.calls[0].arguments[0],
			url.toString(),
		);
	});
});
