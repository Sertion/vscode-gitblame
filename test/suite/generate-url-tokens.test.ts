import * as assert from "node:assert";
import test, { afterEach, beforeEach, mock, suite } from "node:test";
import { setupCachedGit } from "../../src/git/command/CachedGit.js";
import { FileAttachedCommit } from "../../src/git/FileAttachedCommit.js";
import { parseTokens } from "../../src/string-stuff/text-decorator.js";
import { setupPropertyStore } from "../setupPropertyStore.js";

function call(
	func: string | ((index: string | undefined) => string | undefined),
	arg?: string,
) {
	return typeof func === "function" ? func(arg) : func;
}

suite("Generate URL Tokens", () => {
	const fileCommit = FileAttachedCommit.Create(
		{},
		"60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		"10 100 1",
	);
	fileCommit.setByKey("summary", "list_lru: introduce per-memcg lists");
	fileCommit.setByKey("filename", "directory/example.file");

	fileCommit.setByKey("author-mail", "<vdavydov.dev@gmail.com>");
	fileCommit.setByKey("author", "Vladimir Davydov");
	fileCommit.setByKey("author-timestamp", "1423781950");
	fileCommit.setByKey("author-date", "1423781950");
	fileCommit.setByKey("author-tz", "-0800");

	fileCommit.setByKey("committer-mail", "<torvalds@linux-foundation.org>");
	fileCommit.setByKey("committer", "Linus Torvalds");
	fileCommit.setByKey("committer-timestamp", "1423796049");
	fileCommit.setByKey("committer-date", "1423796049");
	fileCommit.setByKey("committer-tz", "-0800");

	const exampleCommit = fileCommit.toLineAttachedCommits().next().value;

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
		t.mock.module("../../src/git/command/execute.js", {
			namedExports: {
				execute: async (
					_: Promise<string>,
					args: string[],
				): Promise<string> => {
					switch (args.join(" ")) {
						case "config branch.main.remote":
							return "origin";
						case "config remote.origin.url":
							return "https://github.com/Sertion/vscode-gitblame.git";
						case "ls-files --full-name -- /fake.file":
							return "/fake.file";
						case "ls-remote --get-url origin":
							return "https://github.com/Sertion/vscode-gitblame.git";
						case "rev-parse --abbrev-ref origin/HEAD":
							return "origin/main";
						case "rev-parse --absolute-git-dir":
							return "/a/path/.git/";
						case "symbolic-ref -q --short HEAD":
							return "main";
						default:
							return "";
					}
				},
			},
		});
		await setupCachedGit();
		const propertyStore = await setupPropertyStore();
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
		t.mock.module("../../src/git/command/execute.js", {
			namedExports: {
				execute: async (
					_: Promise<string>,
					args: string[],
				): Promise<string> => {
					switch (args.join(" ")) {
						case "config branch.main.remote":
							return "origin";
						case "config remote.origin.url":
							return "git@github.com:Sertion/vscode-gitblame.git";
						case "ls-files --full-name -- /fake.file":
							return "/fake.file";
						case "ls-remote --get-url origin":
							return "git@github.com:Sertion/vscode-gitblame.git";
						case "rev-parse --abbrev-ref origin/HEAD":
							return "origin/main";
						case "rev-parse --absolute-git-dir":
							return "/a/path/.git/";
						case "symbolic-ref -q --short HEAD":
							return "main";
						default:
							return "";
					}
				},
			},
		});

		await setupCachedGit();
		const prop = await setupPropertyStore();
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
		t.mock.module("../../src/git/command/execute.js", {
			namedExports: {
				execute: async (
					_: Promise<string>,
					args: string[],
				): Promise<string> => {
					switch (args.join(" ")) {
						case "config branch.main.remote":
							return "origin";
						case "config remote.origin.url":
							return "ssh://git@github.com/Sertion/vscode-gitblame.git";
						case "ls-files --full-name -- /fake.file":
							return "/fake.file";
						case "ls-remote --get-url origin":
							return "ssh://git@github.com/Sertion/vscode-gitblame.git";
						case "rev-parse --abbrev-ref origin/HEAD":
							return "origin/main";
						case "rev-parse --absolute-git-dir":
							return "/a/path/.git/";
						case "symbolic-ref -q --short HEAD":
							return "main";
						default:
							return "";
					}
				},
			},
		});

		await setupCachedGit();
		const prop = await setupPropertyStore();
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
		t.mock.module("../../src/git/command/execute.js", {
			namedExports: {
				execute: async (
					_: Promise<string>,
					args: string[],
				): Promise<string> => {
					switch (args.join(" ")) {
						case "config branch.main.remote":
							return "origin";
						case "config remote.origin.url":
							return "ssh://git@git.company.com/project_x/test-repository.git";
						case "ls-files --full-name -- /fake.file":
							return "/fake.file";
						case "ls-remote --get-url origin":
							return "ssh://git@git.company.com/project_x/test-repository.git";
						case "rev-parse --abbrev-ref origin/HEAD":
							return "origin/main";
						case "rev-parse --absolute-git-dir":
							return "/a/path/.git/";
						case "symbolic-ref -q --short HEAD":
							return "main";
						default:
							return "";
					}
				},
			},
		});

		await setupCachedGit();
		const prop = await setupPropertyStore();
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
		t.mock.module("../../src/git/command/execute.js", {
			namedExports: {
				execute: async (
					_: Promise<string>,
					args: string[],
				): Promise<string> => {
					switch (args.join(" ")) {
						case "config branch.main.remote":
							return "";
						case "config remote.origin.url":
							return "";
						case "ls-files --full-name -- /fake.file":
							return "/fake.file";
						case "ls-remote --get-url origin":
							return "origin";
						case "rev-parse --abbrev-ref origin/HEAD":
							return "origin/main";
						case "rev-parse --absolute-git-dir":
							return "/a/path/.git/";
						case "symbolic-ref -q --short HEAD":
							return "main";
						default:
							return "";
					}
				},
			},
		});

		await setupCachedGit();
		const prop = await setupPropertyStore();
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.strictEqual(tokens, undefined);
	});
});

suite("Use generated URL tokens", () => {
	const fileCommit = FileAttachedCommit.Create(
		{},
		"60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		"10 100 1",
	);
	fileCommit.setByKey("summary", "list_lru: introduce per-memcg lists");
	fileCommit.setByKey("filename", "directory/example.file");

	fileCommit.setByKey("author-mail", "<vdavydov.dev@gmail.com>");
	fileCommit.setByKey("author", "Vladimir Davydov");
	fileCommit.setByKey("author-timestamp", "1423781950");
	fileCommit.setByKey("author-date", "1423781950");
	fileCommit.setByKey("author-tz", "-0800");

	fileCommit.setByKey("committer-mail", "<torvalds@linux-foundation.org>");
	fileCommit.setByKey("committer", "Linus Torvalds");
	fileCommit.setByKey("committer-timestamp", "1423796049");
	fileCommit.setByKey("committer-date", "1423796049");
	fileCommit.setByKey("committer-tz", "-0800");

	const exampleCommit = fileCommit.toLineAttachedCommits().next().value;

	afterEach(() => {
		import("../../src/git/command/CachedGit.js").then((e) => e.git.clear());
	});
	test("Default value", async (t) => {
		t.mock.module("../../src/git/command/execute.js", {
			namedExports: {
				execute: async (
					_: Promise<string>,
					args: string[],
				): Promise<string> => {
					switch (args.join(" ")) {
						case "config branch.main.remote":
							return "origin";
						case "config remote.origin.url":
							return "ssh://git@git.company.com/project_x/test-repository.git";
						case "ls-files --full-name -- /fake.file":
							return "/fake.file";
						case "ls-remote --get-url origin":
							return "ssh://git@git.company.com/project_x/test-repository.git";
						case "rev-parse --abbrev-ref origin/HEAD":
							return "origin/main";
						case "rev-parse --absolute-git-dir":
							return "/a/path/.git/";
						case "symbolic-ref -q --short HEAD":
							return "main";
						default:
							return "";
					}
				},
			},
		});

		await setupCachedGit();
		const prop = await setupPropertyStore();
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.ok(tokens);

		const parsedUrl = parseTokens(
			"${tool.protocol}//${gitorigin.hostname}${gitorigin.port}${gitorigin.path}${tool.commitpath}${hash}",
			tokens,
		);

		assert.strictEqual(
			parsedUrl,
			"https://git.company.com/project_x/test-repository/commit/60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		);
	});

	test("Url with port (#188 regression)", async (t) => {
		t.mock.module("../../src/git/command/execute.js", {
			namedExports: {
				execute: async (
					_: Promise<string>,
					args: string[],
				): Promise<string> => {
					switch (args.join(" ")) {
						case "config branch.main.remote":
							return "origin";
						case "config remote.origin.url":
							return "http://git.company.com:8080/project_x/test-repository.git";
						case "ls-files --full-name -- /fake.file":
							return "/fake.file";
						case "ls-remote --get-url origin":
							return "http://git.company.com:8080/project_x/test-repository.git";
						case "rev-parse --abbrev-ref origin/HEAD":
							return "origin/main";
						case "rev-parse --absolute-git-dir":
							return "/a/path/.git/";
						case "symbolic-ref -q --short HEAD":
							return "main";
						default:
							return "";
					}
				},
			},
		});

		await setupCachedGit();
		const prop = await setupPropertyStore();
		prop.setOverride("remoteName", "origin");

		const tokens = await (
			await import("../../src/git/get-tool-url.js")
		).generateUrlTokens(exampleCommit);

		prop.clearOverrides();

		assert.ok(tokens);

		const parsedUrl = parseTokens(
			"${tool.protocol}//${gitorigin.hostname}${gitorigin.port}${gitorigin.path}${tool.commitpath}${hash}",
			tokens,
		);

		assert.strictEqual(
			parsedUrl,
			"http://git.company.com:8080/project_x/test-repository/commit/60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		);
	});
});
