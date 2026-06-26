import * as assert from "node:assert";
import test, { afterEach, suite, type TestContext } from "node:test";
import { setupCachedGit } from "../../src/git/command/CachedGit.js";
import { Logger } from "../../src/logger.js";
import { setupPropertyStore } from "../setupPropertyStore.js";

const SYMLINK_PATH = "/symlink/admin-server/example.file";
const REAL_PATH = "/real/admin-server/example.file";

type ExecuteMock = Record<string, string>;

const baseExecuteMock: ExecuteMock = {
	[`ls-files --full-name -- ${REAL_PATH}`]: "example.file",
	"rev-parse HEAD": "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
	"symbolic-ref -q --short HEAD": "main",
	"config branch.main.remote": "origin",
	"config remote.origin.url": "https://github.com/Sertion/vscode-gitblame.git",
	"rev-parse --abbrev-ref main/HEAD": "origin/main",
	"ls-remote --get-url origin":
		"https://github.com/Sertion/vscode-gitblame.git",
};

async function setupMocks(
	t: TestContext,
	executeMock: ExecuteMock,
): Promise<{ executeCalls: string[][] }> {
	const executeCalls: string[][] = [];

	t.mock.module("node:fs/promises", {
		namedExports: {
			realpath: async (path: string): Promise<string> =>
				path === SYMLINK_PATH ? REAL_PATH : path,
		},
	});
	t.mock.module("../../src/get-active.js", {
		namedExports: {
			getActiveTextEditor: () => ({
				document: {
					isUntitled: false,
					fileName: SYMLINK_PATH,
					uri: { scheme: "file" },
					lineCount: 1024,
				},
				selection: { active: { line: 1 } },
			}),
		},
	});
	t.mock.module("../../src/git/command/execute.js", {
		namedExports: {
			execute: async (_: Promise<string>, args: string[]): Promise<string> => {
				executeCalls.push(args);
				return executeMock[args.join(" ")] ?? "";
			},
		},
	});

	await setupCachedGit();
	await setupPropertyStore();

	return { executeCalls };
}

suite("getGeneralGitInfo with symlinked workspace path (#215)", () => {
	Logger.createInstance();
	afterEach(() => {
		import("../../src/git/command/CachedGit.js").then((e) => e.git.clear());
	});

	test("runs git against the realpath, not the symlink path", async (t) => {
		const { executeCalls } = await setupMocks(t, baseExecuteMock);

		const info = await (
			await import("../../src/git/command/getGeneralGitInfo.js")
		).getGeneralGitInfo("origin");

		assert.ok(info, "expected git info to be resolved");
		assert.strictEqual(info.relativePathOfActiveFile, "example.file");

		const lsFilesCall = executeCalls.find((args) => args[0] === "ls-files");
		assert.ok(lsFilesCall, "expected a `git ls-files` invocation");
		assert.strictEqual(
			lsFilesCall.at(-1),
			REAL_PATH,
			"`ls-files` must receive the realpath, otherwise git rejects the symlink path as outside the repository",
		);

		assert.ok(
			!executeCalls.some((args) => args.includes(SYMLINK_PATH)),
			"no git command should be called with the unresolved symlink path",
		);
	});
});
