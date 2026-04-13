import * as assert from "node:assert";
import test, {
	afterEach,
	beforeEach,
	mock,
	suite,
	type TestContext,
} from "node:test";
import { setupCachedGit } from "../../src/git/command/CachedGit.js";
import { Logger } from "../../src/logger.js";
import { parseTokens } from "../../src/string-stuff/text-decorator.js";
import { getExampleCommit } from "../getExampleCommit.js";
import { setupPropertyStore } from "../setupPropertyStore.js";

function call(
	func: string | ((param?: string) => string | undefined),
	arg?: string,
) {
	return typeof func === "string" ? func : func(arg);
}

type ExecuteMock = {
	[key: `config branch.${string}.remote`]: string;
	[key: `config remote.${string}.url`]: string;
	"ls-files --full-name -- /fake.file": string;
	[key: `ls-remote --get-url ${string}`]: string;
	[key: `rev-parse --abbrev-ref ${string}/HEAD`]: string;
	"rev-parse --absolute-git-dir": string;
	"symbolic-ref -q --short HEAD": string;
};
async function setupMocks(
	t: TestContext,
	executeMock: ExecuteMock,
	errorMocks: Partial<ExecuteMock> = {},
): Promise<ReturnType<typeof setupPropertyStore>> {
	t.mock.module("../../src/git/command/execute.js", {
		namedExports: {
			execute: async (_: Promise<string>, args: string[]): Promise<string> => {
				const key = args.join(" ") as keyof typeof executeMock;
				if (errorMocks[key] !== undefined) {
					throw new Error(errorMocks[key]);
				}
				return executeMock[key] ?? "";
			},
		},
	});
	await setupCachedGit();
	return await setupPropertyStore();
}

const baseExecuteMock: ExecuteMock = {
	"config branch.main.remote": "origin",
	"config remote.origin.url": "https://github.com/Sertion/vscode-gitblame.git",
	"ls-files --full-name -- /fake.file": "/fake.file",
	"ls-remote --get-url origin":
		"https://github.com/Sertion/vscode-gitblame.git",
	"rev-parse --abbrev-ref origin/HEAD": "origin/main",
	"rev-parse --absolute-git-dir": "/a/path/.git/",
	"symbolic-ref -q --short HEAD": "main",
};

suite("Generate URL Tokens", () => {
	Logger.createInstance();
	const exampleCommit = getExampleCommit();
	beforeEach(async (): Promise<void> => {
		mock.module("../../src/get-active.js", {
			namedExports: {
				getActiveTextEditor: () => ({
					document: {
						isUntitled: false,
						fileName: "/fake.file",
						uri: {
							scheme: "file",
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
	});
	afterEach(() => {
		import("../../src/git/command/CachedGit.js").then((e) => e.git.clear());
		mock.restoreAll();
	});

	test("http:// origin", async (t) => {
		const propertyStore = await setupMocks(t, baseExecuteMock);
		propertyStore.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		propertyStore.clearOverrides();

		assert.ok(tokens);

		assert.strictEqual(call(tokens["gitorigin.hostname"], ""), "github.com");
		assert.strictEqual(call(tokens["gitorigin.hostname"], "0"), "github");
		assert.strictEqual(call(tokens["gitorigin.hostname"], "1"), "com");
		assert.strictEqual(
			call(tokens["gitorigin.path"], ""),
			"/Sertion/vscode-gitblame",
		);
		assert.strictEqual(call(tokens["gitorigin.path"], "0"), "Sertion");
		assert.strictEqual(call(tokens["gitorigin.path"], "1"), "vscode-gitblame");
		assert.strictEqual(
			call(tokens.hash),
			"60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		);
		assert.strictEqual(call(tokens["project.name"]), "vscode-gitblame");
		assert.strictEqual(
			call(tokens["project.remote"]),
			"github.com/Sertion/vscode-gitblame",
		);
		assert.strictEqual(call(tokens["file.path"]), "/fake.file");
	});

	test("git@ origin", async (t) => {
		const prop = await setupMocks(t, {
			...baseExecuteMock,
			"config remote.origin.url": "git@github.com:Sertion/vscode-gitblame.git",
			"ls-remote --get-url origin":
				"git@github.com:Sertion/vscode-gitblame.git",
		});
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.ok(tokens);

		assert.strictEqual(call(tokens["gitorigin.hostname"], ""), "github.com");
		assert.strictEqual(call(tokens["gitorigin.hostname"], "0"), "github");
		assert.strictEqual(call(tokens["gitorigin.hostname"], "1"), "com");
		assert.strictEqual(
			call(tokens["gitorigin.path"], ""),
			"/Sertion/vscode-gitblame",
		);
		assert.strictEqual(call(tokens["gitorigin.path"], "0"), "Sertion");
		assert.strictEqual(call(tokens["gitorigin.path"], "1"), "vscode-gitblame");
		assert.strictEqual(
			call(tokens.hash),
			"60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		);
		assert.strictEqual(call(tokens["project.name"]), "vscode-gitblame");
		assert.strictEqual(
			call(tokens["project.remote"]),
			"github.com/Sertion/vscode-gitblame",
		);
		assert.strictEqual(call(tokens["file.path"]), "/fake.file");
	});

	test("ssh://git@ origin", async (t) => {
		const prop = await setupMocks(t, {
			...baseExecuteMock,
			"config remote.origin.url":
				"ssh://git@github.com/Sertion/vscode-gitblame.git",
			"ls-remote --get-url origin":
				"ssh://git@github.com/Sertion/vscode-gitblame.git",
		});
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.ok(tokens);

		assert.strictEqual(call(tokens["gitorigin.hostname"], ""), "github.com");
		assert.strictEqual(call(tokens["gitorigin.hostname"], "0"), "github");
		assert.strictEqual(call(tokens["gitorigin.hostname"], "1"), "com");
		assert.strictEqual(
			call(tokens["gitorigin.path"], ""),
			"/Sertion/vscode-gitblame",
		);
		assert.strictEqual(call(tokens["gitorigin.path"], "0"), "Sertion");
		assert.strictEqual(call(tokens["gitorigin.path"], "1"), "vscode-gitblame");
		assert.strictEqual(
			call(tokens.hash),
			"60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		);
		assert.strictEqual(call(tokens["project.name"]), "vscode-gitblame");
		assert.strictEqual(
			call(tokens["project.remote"]),
			"github.com/Sertion/vscode-gitblame",
		);
		assert.strictEqual(call(tokens["file.path"]), "/fake.file");
		assert.strictEqual(call(tokens["file.line"]), "100");
	});

	test("ssh://git@git.company.com/project_x/test-repository.git origin", async (t) => {
		const prop = await setupMocks(t, {
			...baseExecuteMock,
			"config remote.origin.url":
				"ssh://git@git.company.com/project_x/test-repository.git",
			"ls-remote --get-url origin":
				"ssh://git@git.company.com/project_x/test-repository.git",
		});
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.ok(tokens);

		assert.strictEqual(
			call(tokens["gitorigin.hostname"], ""),
			"git.company.com",
		);
		assert.strictEqual(call(tokens["gitorigin.hostname"], "0"), "git");
		assert.strictEqual(call(tokens["gitorigin.hostname"], "1"), "company");
		assert.strictEqual(call(tokens["gitorigin.hostname"], "2"), "com");
		assert.strictEqual(
			call(tokens["gitorigin.path"], ""),
			"/project_x/test-repository",
		);
		assert.strictEqual(call(tokens["gitorigin.path"], "0"), "project_x");
		assert.strictEqual(call(tokens["gitorigin.path"], "1"), "test-repository");
		assert.strictEqual(
			call(tokens.hash),
			"60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		);
		assert.strictEqual(call(tokens["project.name"]), "test-repository");
		assert.strictEqual(
			call(tokens["project.remote"]),
			"git.company.com/project_x/test-repository",
		);
		assert.strictEqual(call(tokens["file.path"]), "/fake.file");
		assert.strictEqual(call(tokens["file.line"]), "100");
	});

	test("local development (#128 regression)", async (t) => {
		const prop = await setupMocks(t, {
			...baseExecuteMock,
			"config branch.main.remote": "",
			"config remote.origin.url": "",
			"ls-remote --get-url origin": "origin",
		});
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.strictEqual(tokens, undefined);
	});
	test("configured with empty gitblame.remoteName", async (t) => {
		const prop = await setupMocks(
			t,
			{
				...baseExecuteMock,
				"config remote..url": "",
			},
			{ "config branch.main.remote": "TEST-ERROR" },
		);
		prop.setOverride("remoteName", "");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.strictEqual(tokens, undefined);
	});
});

suite("Use generated URL tokens", () => {
	const exampleCommit = getExampleCommit();
	afterEach(() => {
		import("../../src/git/command/CachedGit.js").then((e) => e.git.clear());
	});
	test("Default value", async (t) => {
		const prop = await setupMocks(t, {
			...baseExecuteMock,
			"config remote.origin.url":
				"ssh://git@git.company.com/project_x/test-repository.git",
			"ls-remote --get-url origin":
				"ssh://git@git.company.com/project_x/test-repository.git",
		});
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.ok(tokens);

		assert.strictEqual(
			parseTokens(
				"${tool.protocol}//${gitorigin.hostname}${gitorigin.port}${gitorigin.path}${tool.commitpath}${hash}",
				tokens,
			),
			"https://git.company.com/project_x/test-repository/commit/60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		);
	});

	test("Url with port (#188 regression)", async (t) => {
		const prop = await setupMocks(t, {
			...baseExecuteMock,
			"config remote.origin.url":
				"http://git.company.com:8080/project_x/test-repository.git",
			"ls-remote --get-url origin":
				"http://git.company.com:8080/project_x/test-repository.git",
		});
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.ok(tokens);

		assert.strictEqual(
			parseTokens(
				"${tool.protocol}//${gitorigin.hostname}${gitorigin.port}${gitorigin.path}${tool.commitpath}${hash}",
				tokens,
			),
			"http://git.company.com:8080/project_x/test-repository/commit/60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		);
	});
});
