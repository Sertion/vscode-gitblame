import * as assert from "node:assert";

import {
    projectNameFromOrigin,
} from "../../src/git/util/project-name-from-origin.mjs";

suite("Origin to project name", (): void => {

    test("https://", (): void => {
        assert.strictEqual(
            projectNameFromOrigin(
                "https://example.com/user/repo.git",
            ),
            "repo",
        );
        assert.strictEqual(
            projectNameFromOrigin("https://example.com/user/repo"),
            "repo",
        );
    });

    test("git@", (): void => {
        assert.strictEqual(
            projectNameFromOrigin("git@example.com/user/repo.git"),
            "repo",
        );
        assert.strictEqual(
            projectNameFromOrigin("git@example.com/user/repo"),
            "repo",
        );
    });

    test("longer than normal path", (): void => {
        assert.strictEqual(
            projectNameFromOrigin(
                "git@example.com/company/group/user/repo.git",
            ),
            "repo",
        );
        assert.strictEqual(
            projectNameFromOrigin(
                "git@example.com/company/group/user/repo",
            ),
            "repo",
        );
    });

    test("non-alphanumeric in path", (): void => {
        assert.strictEqual(
            projectNameFromOrigin(
                "https://example.com/user/re-po.git",
            ),
            "re-po",
        );
        assert.strictEqual(
            projectNameFromOrigin(
                "https://example.com/us.er/repo.git",
            ),
            "repo",
        );
        assert.strictEqual(
            projectNameFromOrigin(
                "https://example.com/user/re.po.git",
            ),
            "re.po",
        );
        assert.strictEqual(
            projectNameFromOrigin(
                "https://example.com/user/re.po",
            ),
            "re.po",
        );
    });
});
