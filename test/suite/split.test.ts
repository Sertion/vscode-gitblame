import * as assert from "node:assert";
import test, { suite } from "node:test";
import { split } from "../../src/string-stuff/split.js";

type TestIteration<T, R> = {
	name: string;
	args: T;
	expect: R;
};

suite("Split", (): void => {
	const tests: TestIteration<Parameters<typeof split>, string[]>[] = [
		{
			name: "Single Space",
			args: ["single space"],
			expect: ["single", "space"],
		},
		{
			name: "Multiple Spaces",
			args: ["multiple spaces in this test right here"],
			expect: ["multiple", "spaces in this test right here"],
		},
		{ name: "No Spaces", args: ["oneword"], expect: ["oneword", ""] },
		{
			name: "Trim results",
			args: ["trim    result   "],
			expect: ["trim", "result"],
		},
		{
			name: "Single Ampersand",
			args: ["single&ampersand", "&"],
			expect: ["single", "ampersand"],
		},
		{
			name: "Short second parameter",
			args: ["bad second argument", ""],
			expect: ["bad second argument", ""],
		},
		{
			name: "Long second parameter",
			args: ["bad second argument long", "long"],
			expect: ["bad second argument ", "ong"],
		},
	];

	for (const { name, args, expect } of tests) {
		test(name, () => assert.deepStrictEqual(split(...args), expect));
	}
});
