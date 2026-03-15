import * as assert from "node:assert";
import test, { before, suite } from "node:test";
import { scheduler } from "node:timers/promises";
import type { Queue as QueueType } from "../../src/git/queue.js";
import { Logger } from "../../src/logger.js";

function sleep<T>(time: number, response: T): Promise<T> {
	const { promise, resolve } = Promise.withResolvers<T>();
	setTimeout(resolve, time, response);
	return promise;
}

suite("Promise Queue", { concurrency: true }, async (): Promise<void> => {
	Logger.createInstance();
	let Queue: typeof QueueType;
	before(async () => {
		Queue = (await import("../../src/git/queue.js")).Queue;
	});

	test("Create Instance", (): void => {
		const instance = new Queue();

		assert.ok(instance instanceof Queue, "is instance of Queue");
	});

	test("Pass through when queue is short", async (t): Promise<void> => {
		const instance = new Queue();
		const spy = t.mock.fn(() => Promise.resolve());

		await instance.add(spy);

		assert.strictEqual(spy.mock.callCount(), 1);
	});

	test("Don't run when adding to queue and it is to long, then run it when ready", async (t): Promise<void> => {
		t.mock.timers.enable({ apis: ["setTimeout"] });

		const instance = new Queue<undefined>();

		const spy1 = t.mock.fn(() => sleep(100, undefined));
		const spy2 = t.mock.fn(() => sleep(100, undefined));
		const spy3 = t.mock.fn(() => sleep(100, undefined));

		instance.add(spy1);
		instance.add(spy2);
		instance.add(spy3);

		t.mock.timers.tick(50);

		assert.strictEqual(spy1.mock.callCount(), 1);
		assert.strictEqual(spy2.mock.callCount(), 1);
		assert.strictEqual(spy3.mock.callCount(), 0);

		t.mock.timers.tick(50);

		assert.strictEqual(spy2.mock.callCount(), 1);

		t.mock.timers.runAll();
	});

	test("Being able to use the value from the original promise", async (): Promise<void> => {
		const instance = new Queue<string>();
		const myFunc = () => Promise.resolve("UNIQUE_VALUE");

		const result = await instance.add(myFunc);

		assert.strictEqual(result, "UNIQUE_VALUE");
	});

	test("Being able to use the value from the original promise after queue", {
		timeout: 500,
	}, async (t): Promise<void> => {
		t.mock.timers.enable({ apis: ["setTimeout"] });

		const instance = new Queue<string>();
		const myFunc1 = () => sleep(100, "UNIQUE_VALUE_1");
		const myFunc2 = () => sleep(100, "UNIQUE_VALUE_2");
		const myFunc3 = () => sleep(100, "UNIQUE_VALUE_3");

		const call1 = instance.add(myFunc1);
		const call2 = instance.add(myFunc2);
		const call3 = instance.add(myFunc3);

		t.mock.timers.tick(200);
		await scheduler.yield();

		assert.strictEqual(await call1, "UNIQUE_VALUE_1");
		assert.strictEqual(await call2, "UNIQUE_VALUE_2");
		assert.strictEqual(await call3, "UNIQUE_VALUE_3");
	});

	test("Minimum 1 parallel queue size", async (): Promise<void> => {
		const instance = new Queue<void>(-1);

		assert.strictEqual(await instance.add(() => Promise.resolve()), undefined);
	});

	test("Increase max parallel runs more things", async (t): Promise<void> => {
		t.mock.timers.enable({ apis: ["setTimeout"] });

		const instance = new Queue<undefined>(1);

		const spy1 = t.mock.fn(() => sleep(100, undefined));
		const spy2 = t.mock.fn(() => sleep(100, undefined));
		const spy3 = t.mock.fn(() => sleep(100, undefined));

		instance.add(spy1);
		instance.add(spy2);
		instance.add(spy3);

		assert.strictEqual(spy1.mock.callCount(), 1);
		assert.strictEqual(spy2.mock.callCount(), 0);
		assert.strictEqual(spy3.mock.callCount(), 0);

		instance.updateParallel(3);

		assert.strictEqual(spy2.mock.callCount(), 1);
		assert.strictEqual(spy3.mock.callCount(), 1);

		t.mock.timers.runAll();
	});

	test("Decrease max parallel does not run more things", async (t): Promise<void> => {
		t.mock.timers.enable({ apis: ["setTimeout"] });

		const instance = new Queue<undefined>(2);

		const spy1 = t.mock.fn(() => sleep(100, undefined));
		const spy2 = t.mock.fn(() => sleep(100, undefined));
		const spy3 = t.mock.fn(() => sleep(100, undefined));
		const spy4 = t.mock.fn(() => sleep(100, undefined));

		instance.add(spy1);
		instance.add(spy2);
		instance.add(spy3);

		assert.strictEqual(spy1.mock.callCount(), 1, "Did not execute any");
		assert.strictEqual(spy2.mock.callCount(), 1);
		assert.strictEqual(spy3.mock.callCount(), 0, "Executed all three");

		instance.updateParallel(1);
		instance.add(spy4);

		t.mock.timers.tick(50);

		assert.strictEqual(spy3.mock.callCount(), 0, "Executed too early");
		assert.strictEqual(spy4.mock.callCount(), 0);

		t.mock.timers.tick(100);
		await scheduler.yield();

		assert.strictEqual(spy3.mock.callCount(), 1, "Fail to execute after wait");
		assert.strictEqual(
			spy4.mock.callCount(),
			0,
			"Executed to early after wait",
		);

		t.mock.timers.runAll();
	});
});
