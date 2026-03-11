import * as assert from "node:assert";
import test, { mock, suite } from "node:test";
import { Logger } from "../../src/logger.js";
import { split, splitChunk } from "../../src/string-stuff/split.js";

type TestIteration<T, R> = {
	name: string;
	args: T;
	expect: R;
};

suite("Split strings", (): void => {
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

suite("Split chunk", () => {
	Logger.createInstance();
	test("Split empty chunk", async () => {
		assert.deepEqual(await splitChunk(Buffer.from("")).next(), {
			value: undefined,
			done: true,
		});
	});

	test("Split chunk with spaces", async () => {
		const iterator = splitChunk(
			Buffer.from("long string\nsecond long string\n"),
		);
		assert.deepEqual(await iterator.next(), {
			value: ["long", "string"],
			done: false,
		});
		assert.deepEqual(await iterator.next(), {
			value: ["second", "long string"],
			done: false,
		});
		assert.deepEqual(await iterator.next(), {
			value: undefined,
			done: true,
		});
	});

	test("Split chunk without spaces", async () => {
		const iterator = splitChunk(Buffer.from("longstring\nsecondlongstring\n"));
		assert.deepEqual(await iterator.next(), {
			value: ["longstring", ""],
			done: false,
		});
		assert.deepEqual(await iterator.next(), {
			value: ["secondlongstring", ""],
			done: false,
		});
		assert.deepEqual(await iterator.next(), {
			value: undefined,
			done: true,
		});
	});
});

suite("Regression test for process locking when blaming takes too long", () => {
	test("Splitting over a long time should yield to the scheduler", async () => {
		mock.timers.enable({ apis: ["Date"], now: 0 });
		const fn = mock.fn();
		Logger.createInstance({ debug: fn });

		const iterator = splitChunk(
			Buffer.from(Array.from({ length: 10 }, () => "thing to find").join("\n")),
		);

		await iterator.next();
		await iterator.next();

		assert.strictEqual(fn.mock.callCount(), 0);

		mock.timers.setTime(2000);

		await iterator.next();
		await iterator.next();

		assert.strictEqual(fn.mock.callCount(), 1);

		mock.timers.reset();
	});
});
