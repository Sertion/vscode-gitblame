import assert from "node:assert";
import { afterEach, before, mock, suite, test } from "node:test";

import type { addCommitHashToClipboard as addCommitHashToClipboardType } from "../../src/gitblame.addCommitHashToClipboard.js";
import { getExampleCommit } from "../getExampleCommit.js";

suite("gitblame.addCommitHashToClipboard", () => {
	let addCommitHashToClipboard: typeof addCommitHashToClipboardType;
	const infoMessageMock = mock.fn();
	const errorMessageMock = mock.fn();
	before(async () => {
		mock.module("../../src/message.js", {
			namedExports: {
				infoMessage: infoMessageMock,
				errorMessage: errorMessageMock,
			},
		});
		addCommitHashToClipboard = (
			await import("../../src/gitblame.addCommitHashToClipboard.js")
		).addCommitHashToClipboard;
	});

	afterEach(() => {
		infoMessageMock.mock.resetCalls();
		errorMessageMock.mock.resetCalls();
	});

	test("Without extension it should respond with error", async () => {
		await addCommitHashToClipboard(undefined, () => Promise.resolve());

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
	test("With extension without commited commit it should respond with error", async () => {
		const exampleCommit = getExampleCommit();
		exampleCommit.commit.setByKey(
			"0000000000000000000000000000000000000000",
			"",
		);

		await addCommitHashToClipboard(
			{ commit: () => Promise.resolve(exampleCommit) },
			() => Promise.resolve(),
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
		const mockCopy = mock.fn(() => Promise.resolve());
		const exampleCommit = getExampleCommit();

		await addCommitHashToClipboard(
			{ commit: () => Promise.resolve(exampleCommit) },
			mockCopy,
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
			mockCopy.mock.callCount(),
			1,
			"mockCopy should be called",
		);
		assert.deepEqual(mockCopy.mock.calls[0].arguments, [
			exampleCommit.commit.hash,
		]);
	});
});
