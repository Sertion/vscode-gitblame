import * as assert from "node:assert";
import { afterEach, before, suite, type TestContext, test } from "node:test";
import type { git as gitType } from "../../src/git/command/CachedGit.js";
import type {
	getToolUrl as getToolUrlType,
	gitRemotePath as gitRemotePathType,
} from "../../src/git/get-tool-url.js";
import { Logger } from "../../src/logger.js";
import { getExampleCommit } from "../getExampleCommit.js";
import { setupPropertyStore } from "../setupPropertyStore.js";

function call(
	func: string | ((param?: string) => string | undefined),
	arg?: string,
) {
	return typeof func === "string" ? func : func(arg);
}

type ReturnValue = {
	remoteUrl: string;
	currentBranch: string;
	defaultBranch: string;
	currentHash: string;
	relativePathOfActiveFile: string;
	fileOrigin: string;
};
const baseGitInfoMock: ReturnValue = {
	remoteUrl: "git@github.com:Sertion/vscode-gitblame.git",
	currentBranch: "main",
	defaultBranch: "main",
	currentHash: "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
	relativePathOfActiveFile: "./example/path",
	fileOrigin: "git@github.com:Sertion/vscode-gitblame.git",
};
let overrideGitInfoMock: Partial<ReturnValue> = {};
async function setupMocks(
	t: TestContext,
): Promise<ReturnType<typeof setupPropertyStore>> {
	t.mock.module("../../src/git/command/getGeneralGitInfo.ts", {
		exports: {
			getGeneralGitInfo: async (): Promise<
				| {
						remoteUrl: string;
						currentBranch: string;
						defaultBranch: string;
						currentHash: string;
						relativePathOfActiveFile: string;
						fileOrigin: string;
				  }
				| undefined
			> => ({ ...baseGitInfoMock, ...overrideGitInfoMock }),
		},
	});
	return await setupPropertyStore();
}

suite("Get tool URL: gitRemotePath", (): void => {
	Logger.createInstance();
	let git: typeof gitType;
	let gitRemotePath: typeof gitRemotePathType;
	before(async () => {
		git = (await import("../../src/git/command/CachedGit.js")).git;
		gitRemotePath = (await import("../../src/git/get-tool-url.js"))
			.gitRemotePath;
	});
	afterEach(() => git.clear());

	test("http://", (): void => {
		const func = gitRemotePath("http://example.com/path/to/something/");

		assert.strictEqual(call(func), "/path/to/something/");
		assert.strictEqual(call(func, "0"), "path");
		assert.strictEqual(call(func, "1"), "to");
		assert.strictEqual(call(func, "2"), "something");
	});
	test("https://", (): void => {
		const func = gitRemotePath("https://example.com/path/to/something/");

		assert.strictEqual(call(func), "/path/to/something/");
		assert.strictEqual(call(func, "0"), "path");
		assert.strictEqual(call(func, "1"), "to");
		assert.strictEqual(call(func, "2"), "something");
	});
	test("ssh://", (): void => {
		const func = gitRemotePath("ssh://example.com/path/to/something/");

		assert.strictEqual(call(func), "/path/to/something/");
		assert.strictEqual(call(func, "0"), "path");
		assert.strictEqual(call(func, "1"), "to");
		assert.strictEqual(call(func, "2"), "something");
	});
	test("git@", (): void => {
		const func = gitRemotePath("git@example.com:path/to/something/");

		assert.strictEqual(call(func), "/path/to/something/");
		assert.strictEqual(call(func, "0"), "path");
		assert.strictEqual(call(func, "1"), "to");
		assert.strictEqual(call(func, "2"), "something");
	});
	test("org-1234@", (): void => {
		const func = gitRemotePath("org-1234@example.com:path/to/something/");

		assert.strictEqual(call(func), "/path/to/something/");
		assert.strictEqual(call(func, "0"), "path");
		assert.strictEqual(call(func, "1"), "to");
		assert.strictEqual(call(func, "2"), "something");
	});
	test("http:// with port", (): void => {
		const func = gitRemotePath("http://example.com:8080/path/to/something/");

		assert.strictEqual(call(func), "/path/to/something/");
		assert.strictEqual(call(func, "0"), "path");
		assert.strictEqual(call(func, "1"), "to");
		assert.strictEqual(call(func, "2"), "something");
	});
	test("https:// with port", (): void => {
		const func = gitRemotePath("https://example.com:8080/path/to/something/");

		assert.strictEqual(call(func), "/path/to/something/");
		assert.strictEqual(call(func, "0"), "path");
		assert.strictEqual(call(func, "1"), "to");
		assert.strictEqual(call(func, "2"), "something");
	});
	test("ssh:// with port", (): void => {
		const func = gitRemotePath("ssh://example.com:8080/path/to/something/");

		assert.strictEqual(call(func), "/path/to/something/");
		assert.strictEqual(call(func, "0"), "path");
		assert.strictEqual(call(func, "1"), "to");
		assert.strictEqual(call(func, "2"), "something");
	});

	test("Empty input", (): void => {
		const func = gitRemotePath("");

		assert.strictEqual(call(func), "no-remote-url");
	});
	test("Weird input", (): void => {
		const func = gitRemotePath("weird input");

		assert.strictEqual(call(func), "no-remote-url");
	});
	test("Out of bounds input", (): void => {
		const func = gitRemotePath("https://part/");

		assert.strictEqual(
			call(func, Number.MAX_SAFE_INTEGER.toString()),
			"invalid-index",
		);
	});
});

suite("Get tool URL", (): void => {
	Logger.createInstance();
	let git: typeof gitType;
	let getToolUrl: typeof getToolUrlType;
	before(async () => {
		git = (await import("../../src/git/command/CachedGit.js")).git;
		getToolUrl = (await import("../../src/git/get-tool-url.js")).getToolUrl;
	});
	afterEach(() => {
		git.clear();
		overrideGitInfoMock = {};
	});

	test("hostname override", async (t: TestContext): Promise<void> => {
		const prop = await setupMocks(t);
		overrideGitInfoMock = {};
		prop.setOverride("commitUrl.perHostnameOverride", {
			"github.com": "https://different-url/with/path",
		});

		const exampleCommit = getExampleCommit();
		const url = await getToolUrl(exampleCommit);

		assert.strictEqual(url.toString(), "https://different-url/with/path");
	});
});
