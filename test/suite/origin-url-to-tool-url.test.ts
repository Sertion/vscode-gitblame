import test, { suite } from "node:test";
import { originUrlToToolUrl } from "../../src/git/origin-url-to-tool-url.js";
import { setupPropertyStore } from "../setupPropertyStore.js";

suite("Web URL formatting", (): void => {
	test("https://", (t): void => {
		t.assert.snapshot(originUrlToToolUrl("https://example.com/user/repo.git"));
		t.assert.snapshot(originUrlToToolUrl("https://example.com/user/repo"));
	});

	test("git@", (t): void => {
		t.assert.snapshot(originUrlToToolUrl("git@example.com:user/repo.git"));
		t.assert.snapshot(originUrlToToolUrl("git@example.com:user/repo"));
	});

	test("username@", (t): void => {
		t.assert.snapshot(originUrlToToolUrl("username@example.com:user/repo.git"));
		t.assert.snapshot(originUrlToToolUrl("username@example.com:user/repo"));
	});

	test("username:password@", (t): void => {
		t.assert.snapshot(
			originUrlToToolUrl("username:password@example.com:user/repo.git"),
		);
		t.assert.snapshot(originUrlToToolUrl("username@example.com:user/repo"));
	});

	test("https:// with port", (t): void => {
		t.assert.snapshot(
			originUrlToToolUrl("https://example.com:8080/user/repo.git"),
		);
		t.assert.snapshot(originUrlToToolUrl("https://example.com:8080/user/repo"));
	});

	test("http:// with port", (t): void => {
		t.assert.snapshot(
			originUrlToToolUrl("http://example.com:8080/user/repo.git"),
		);
		t.assert.snapshot(originUrlToToolUrl("http://example.com:8080/user/repo"));
	});

	test("git@ with port", (t): void => {
		t.assert.snapshot(originUrlToToolUrl("git@example.com:8080/user/repo.git"));
		t.assert.snapshot(originUrlToToolUrl("git@example.com:8080/user/repo"));
	});

	test("git@ with port and password", (t): void => {
		t.assert.snapshot(
			originUrlToToolUrl("git:pass@example.com:8080/user/repo.git"),
		);
		t.assert.snapshot(originUrlToToolUrl("git@example.com:8080/user/repo"));
	});

	test("https:// with port, username and password", (t): void => {
		t.assert.snapshot(
			originUrlToToolUrl("https://user:pass@example.com:8080/user/repo.git"),
		);
	});

	test("https:// with username and password", (t): void => {
		t.assert.snapshot(
			originUrlToToolUrl("https://user:pass@example.com/user/repo.git"),
		);
	});

	test("https:// plural", async (t): Promise<void> => {
		const props = await setupPropertyStore();
		props.setOverride("pluralWebPathSubstrings", ["example.com"]);

		t.assert.snapshot(originUrlToToolUrl("https://example.com/user/repo.git"));
		t.assert.snapshot(originUrlToToolUrl("https://example.com/user/repo"));

		props.clearOverrides();
	});

	test("ssh:// short host no user", (t): void => {
		t.assert.snapshot(
			originUrlToToolUrl("ssh://user@host:8080/SomeProject.git"),
		);
		t.assert.snapshot(originUrlToToolUrl("ssh://user@host:8080/SomeProject"));
	});

	test("non-alphanumeric in path", (t): void => {
		t.assert.snapshot(originUrlToToolUrl("https://example.com/us.er/repo.git"));
		t.assert.snapshot(originUrlToToolUrl("https://example.com/user/re-po.git"));
		t.assert.snapshot(
			originUrlToToolUrl("https://example.com/user/re%20po.git"),
		);
		t.assert.snapshot(
			originUrlToToolUrl("ssh://user@example.com:us.er/repo.git"),
		);
	});
});
