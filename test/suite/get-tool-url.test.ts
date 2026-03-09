import * as assert from "node:assert";
import test, { afterEach, before, suite } from "node:test";
import type { git as gitType } from "../../src/git/command/CachedGit.js";
import type { gitRemotePath as gitRemotePathType } from "../../src/git/get-tool-url.js";
import { Logger } from "../../src/logger.js";

function call(
	func: string | ((param?: string) => string | undefined),
	arg?: string,
) {
	return typeof func === "string" ? func : func(arg);
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
