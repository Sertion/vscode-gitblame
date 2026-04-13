import assert from "node:assert";
import { afterEach, before, mock, suite, test } from "node:test";
import type { TerminalOptions } from "vscode";
import type { gitShow as gitShowType } from "../../src/gitblame.gitShow.js";
import { getExampleCommit } from "../getExampleCommit.js";
import { setupPropertyStore } from "../setupPropertyStore.js";
import { Logger } from "../../src/logger.js";

suite("gitblame.gitShow", () => {
	let gitShow: typeof gitShowType;
	const infoMessageMock = mock.fn();
	const errorMessageMock = mock.fn();

	let getActiveTextEditorDocumentUriScheme = "file";
	before(async () => {
		mock.module("../../src/get-active.js", {
			namedExports: {
				getActiveTextEditor: () => ({
					document: {
						isUntitled: false,
						fileName: "/fake.file",
						uri: {
							scheme: getActiveTextEditorDocumentUriScheme,
						},
						lineCount: 1024,
					},
					selection: {
						active: {
							line: 1,
						},
					},
				}),
			},
		});
		mock.module("../../src/message.js", {
			namedExports: {
				infoMessage: infoMessageMock,
				errorMessage: errorMessageMock,
			},
		});
		gitShow = (await import("../../src/gitblame.gitShow.js")).gitShow;
	});

	afterEach(() => {
		infoMessageMock.mock.resetCalls();
		errorMessageMock.mock.resetCalls();
		getActiveTextEditorDocumentUriScheme = "file";
	});

	test("Without extension it should respond with error", async () => {
		await gitShow(undefined, (_: TerminalOptions) => ({
			show: mock.fn(),
			sendText: mock.fn(),
		}));

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

	test("With extension without commit it should respond with error", async () => {
		const mockCreateTerminal = mock.fn((_: TerminalOptions) => ({
			show: mock.fn(),
			sendText: mock.fn(),
		}));

		await gitShow(
			{ commit: () => Promise.resolve(undefined) },
			mockCreateTerminal,
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

	test("Without valid editor it should send an error message about that", async () => {
		const mockCreateTerminal = mock.fn((_: TerminalOptions) => ({
			show: mock.fn(),
			sendText: mock.fn(),
		}));
		getActiveTextEditorDocumentUriScheme = "test";

		await gitShow(
			{ commit: () => Promise.resolve(undefined) },
			mockCreateTerminal,
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

	test("With extension with commit it should create a terminal", async () => {
		const store = await setupPropertyStore();
		store.setOverride("ignoreWhitespace", false);
		const showMock = mock.fn();
		const sendTextMock = mock.fn();
		const mockCreateTerminal = mock.fn((_: TerminalOptions) => ({
			show: showMock,
			sendText: sendTextMock,
		}));

		const commit = getExampleCommit();
		await gitShow(
			{ commit: () => Promise.resolve(commit) },
			mockCreateTerminal,
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
			mockCreateTerminal.mock.callCount(),
			1,
			"mockCreateTerminal should be called",
		);
		assert.deepEqual(mockCreateTerminal.mock.calls[0].arguments, [
			{
				name: `Git Blame: git show ${commit.commit.hash}`,
				iconPath: { id: "git-commit" },
				isTransient: true,
				cwd: "/",
			},
		]);
		assert.strictEqual(sendTextMock.mock.callCount(), 1);
		assert.deepEqual(sendTextMock.mock.calls[0].arguments, [
			`git show ${commit.commit.hash}; exit 0`,
			true,
		]);
		assert.strictEqual(showMock.mock.callCount(), 1);
	});

	test("With extension with commit it should create a terminal with ignoreWhitespace", async () => {
		const store = await setupPropertyStore();
		store.setOverride("ignoreWhitespace", true);
		const sendTextMock = mock.fn();
		const mockCreateTerminal = mock.fn((_: TerminalOptions) => ({
			show: mock.fn(),
			sendText: sendTextMock,
		}));

		const commit = getExampleCommit();
		await gitShow(
			{ commit: () => Promise.resolve(commit) },
			mockCreateTerminal,
		);

		assert.strictEqual(sendTextMock.mock.callCount(), 1);
		assert.deepEqual(sendTextMock.mock.calls[0].arguments, [
			`git show -w ${commit.commit.hash}; exit 0`,
			true,
		]);
	});

	test("If hash somehow is not in the expected format we should not create a terminal", async () => {
		const sendTextMock = mock.fn();
		const mockCreateTerminal = mock.fn((_: TerminalOptions) => ({
			show: mock.fn(),
			sendText: sendTextMock,
		}));

		const commit = getExampleCommit();
		commit.commit.hash = "Invalid Hash";
		await gitShow(
			{ commit: () => Promise.resolve(commit) },
			mockCreateTerminal,
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
		assert.strictEqual(
			sendTextMock.mock.callCount(),
			0,
			"terminal.sendText should not be called",
		);
	});
});
