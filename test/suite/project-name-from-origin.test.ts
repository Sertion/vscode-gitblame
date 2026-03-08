import * as assert from "node:assert";
import test, { suite } from "node:test";
import { projectNameFromOrigin } from "../../src/git/project-name-from-origin.js";

type TestIteration<T, R> = {
	name: string;
	args: T;
	expect: R;
};

suite("Origin to project name", (): void => {
	const tests: TestIteration<
		Parameters<typeof projectNameFromOrigin>,
		string
	>[] = [
		{
			name: "https://",
			args: ["https://example.com/user/repo.git"],
			expect: "repo",
		},
		{
			name: "https:// (with extension)",
			args: ["https://example.com/user/repo"],
			expect: "repo",
		},
		{ name: "git@", args: ["git@example.com/user/repo.git"], expect: "repo" },
		{
			name: "git@ (with extension)",
			args: ["git@example.com/user/repo"],
			expect: "repo",
		},
		{
			name: "longer than normal path",
			args: ["git@example.com/company/group/user/repo.git"],
			expect: "repo",
		},
		{
			name: "longer than normal path (with extension)",
			args: ["git@example.com/company/group/user/repo"],
			expect: "repo",
		},
		{
			name: "non-alphanumeric in path",
			args: ["https://example.com/user/re-po.git"],
			expect: "re-po",
		},
		{
			name: "non-alphanumeric in path (with extension)",
			args: ["https://example.com/us.er/repo.git"],
			expect: "repo",
		},
		{
			name: "non-alphanumeric in path (with extension)",
			args: ["https://example.com/user/re.po.git"],
			expect: "re.po",
		},
		{
			name: "non-alphanumeric in path (with extension)",
			args: ["https://example.com/user/re.po"],
			expect: "re.po",
		},
	];

	for (const { name, args, expect } of tests) {
		test(name, () =>
			assert.strictEqual(projectNameFromOrigin(...args), expect),
		);
	}
});
