import * as assert from "node:assert";

import { gitRemotePath } from "../../src/git/util/get-tool-url.mjs";

suite("Get tool URL: gitRemotePath", (): void => {
    const call = (
        func: string | ((param?: string) => string | undefined),
        arg?: string,
    ) => typeof func === "string" ? func : func(arg);

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
        assert.strictEqual(call(func), "no-remote-url");
    });
    test("Weird input", (): void => {
        const func = gitRemotePath("weird input");

        assert.strictEqual(call(func), "no-remote-url");
        assert.strictEqual(call(func), "no-remote-url");
    });
});
