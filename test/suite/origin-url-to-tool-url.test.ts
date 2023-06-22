import * as assert from "node:assert";
import { stub } from "sinon";

import { originUrlToToolUrl } from "../../src/git/util/origin-url-to-tool-url.js";
import * as prop from "../../src/util/property.js";

suite("Web URL formatting", (): void => {
	test("https://", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("https://example.com/user/repo.git")?.toString(),
			"https://example.com/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("https://example.com/user/repo")?.toString(),
			"https://example.com/user/repo",
		);
	});

	test("git@", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("git@example.com:user/repo.git")?.toString(),
			"https://example.com/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("git@example.com:user/repo")?.toString(),
			"https://example.com/user/repo",
		);
	});

	test("username@", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("username@example.com:user/repo.git")?.toString(),
			"https://example.com/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("username@example.com:user/repo")?.toString(),
			"https://example.com/user/repo",
		);
	});

	test("username:password@", (): void => {
		assert.strictEqual(
			originUrlToToolUrl(
				"username:password@example.com:user/repo.git",
			)?.toString(),
			"https://example.com/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("username@example.com:user/repo")?.toString(),
			"https://example.com/user/repo",
		);
	});

	test("https:// with port", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("https://example.com:8080/user/repo.git")?.toString(),
			"https://example.com:8080/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("https://example.com:8080/user/repo")?.toString(),
			"https://example.com:8080/user/repo",
		);
	});

	test("http:// with port", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("http://example.com:8080/user/repo.git")?.toString(),
			"http://example.com:8080/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("http://example.com:8080/user/repo")?.toString(),
			"http://example.com:8080/user/repo",
		);
	});

	test("git@ with port", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("git@example.com:8080/user/repo.git")?.toString(),
			"https://example.com/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("git@example.com:8080/user/repo")?.toString(),
			"https://example.com/user/repo",
		);
	});

	test("git@ with port and password", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("git:pass@example.com:8080/user/repo.git")?.toString(),
			"https://example.com/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("git@example.com:8080/user/repo")?.toString(),
			"https://example.com/user/repo",
		);
	});

	test("https:// with port, username and password", (): void => {
		assert.strictEqual(
			originUrlToToolUrl(
				"https://user:pass@example.com:8080/user/repo.git",
			)?.toString(),
			"https://example.com:8080/user/repo",
		);
	});

	test("https:// with username and password", (): void => {
		assert.strictEqual(
			originUrlToToolUrl(
				"https://user:pass@example.com/user/repo.git",
			)?.toString(),
			"https://example.com/user/repo",
		);
	});

	test("https:// plural", (): void => {
		const propertyStub = stub(prop, "getProperty");
		propertyStub.withArgs("pluralWebPathSubstrings").returns(["example.com"]);

		assert.strictEqual(
			originUrlToToolUrl("https://example.com/user/repo.git")?.toString(),
			"https://example.com/user/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("https://example.com/user/repo")?.toString(),
			"https://example.com/user/repo",
		);

		propertyStub.restore();
	});

	test("ssh:// short host no user", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("ssh://user@host:8080/SomeProject.git")?.toString(),
			"https://host/SomeProject",
		);
		assert.strictEqual(
			originUrlToToolUrl("ssh://user@host:8080/SomeProject")?.toString(),
			"https://host/SomeProject",
		);
	});

	test("non-alphanumeric in path", (): void => {
		assert.strictEqual(
			originUrlToToolUrl("https://example.com/us.er/repo.git")?.toString(),
			"https://example.com/us.er/repo",
		);
		assert.strictEqual(
			originUrlToToolUrl("https://example.com/user/re-po.git")?.toString(),
			"https://example.com/user/re-po",
		);
		assert.strictEqual(
			originUrlToToolUrl("https://example.com/user/re%20po.git")?.toString(),
			"https://example.com/user/re%20po",
		);
		assert.strictEqual(
			originUrlToToolUrl("ssh://user@example.com:us.er/repo.git")?.toString(),
			"https://example.com/us.er/repo",
		);
	});
});
