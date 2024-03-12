import * as assert from "node:assert";
import { Queue } from "../../src/git/queue.js";
import * as Sinon from "sinon";
import { afterEach, beforeEach } from "mocha";

const sleep = <T>(time: number, response: T): Promise<T> => {
	return new Promise((resolve) =>
		setTimeout(() => {
			resolve(response);
		}, time),
	);
};

suite("Promise Queue", (): void => {
	let clock: Sinon.SinonFakeTimers | undefined = undefined;

	beforeEach(() => {
		clock = Sinon.useFakeTimers();
	});

	afterEach(() => {
		clock?.restore();
	});

	test("Create Instance", (): void => {
		const instance = new Queue();

		assert.deepStrictEqual(
			instance instanceof Queue,
			true,
			"is instance of Queue",
		);
	});

	test("Pass through when queue is short", async (): Promise<void> => {
		const instance = new Queue();
		const spy = Sinon.spy(() => Promise.resolve());

		await instance.add(spy);

		Sinon.assert.calledOnce(spy);
	});

	test("Don't run when adding to queue and it is to long, then run it when ready", async (): Promise<void> => {
		const instance = new Queue<undefined>();

		const spy1 = Sinon.spy(() => sleep(100, undefined));
		const spy2 = Sinon.spy(() => sleep(100, undefined));
		const spy3 = Sinon.spy(() => sleep(100, undefined));

		instance.add(spy1);
		instance.add(spy2);
		instance.add(spy3);

		await clock?.tickAsync(50);

		Sinon.assert.calledOnce(spy1);
		Sinon.assert.calledOnce(spy2);
		Sinon.assert.notCalled(spy3);

		await clock?.tickAsync(50);

		Sinon.assert.calledOnce(spy2);

		await clock?.runAllAsync();
	});

	test("Being able to use the value from the original promise", async (): Promise<void> => {
		const instance = new Queue<string>();
		const myFunc = () => Promise.resolve("UNIQUE_VALUE");

		const result = await instance.add(myFunc);

		assert.strictEqual(result, "UNIQUE_VALUE");
	});

	test("Being able to use the value from the original promise after queue", async (): Promise<void> => {
		const instance = new Queue<string>();
		const myFunc1 = () => sleep(100, "UNIQUE_VALUE_1");
		const myFunc2 = () => sleep(100, "UNIQUE_VALUE_2");
		const myFunc3 = () => sleep(100, "UNIQUE_VALUE_3");

		const call1 = instance.add(myFunc1);
		const call2 = instance.add(myFunc2);
		const call3 = instance.add(myFunc3);

		await clock?.tickAsync(200);

		assert.strictEqual(await call1, "UNIQUE_VALUE_1");
		assert.strictEqual(await call2, "UNIQUE_VALUE_2");
		assert.strictEqual(await call3, "UNIQUE_VALUE_3");
	});

	test("Mimimum 1 parallel queue size", async (): Promise<void> => {
		const instance = new Queue<void>(-1);

		assert.strictEqual(await instance.add(() => Promise.resolve()), undefined);
	});

	test("Increase max parallel runs more things", async (): Promise<void> => {
		const instance = new Queue<undefined>(1);

		const spy1 = Sinon.spy(() => sleep(100, undefined));
		const spy2 = Sinon.spy(() => sleep(100, undefined));
		const spy3 = Sinon.spy(() => sleep(100, undefined));

		instance.add(spy1);
		instance.add(spy2);
		instance.add(spy3);

		Sinon.assert.calledOnce(spy1);
		Sinon.assert.notCalled(spy2);
		Sinon.assert.notCalled(spy3);

		instance.updateParalell(3);

		Sinon.assert.calledOnce(spy2);
		Sinon.assert.calledOnce(spy3);

		await clock?.runAllAsync();
	});

	test("Decrease max parallel does not run more things", async (): Promise<void> => {
		const instance = new Queue<undefined>(2);

		const spy1 = Sinon.spy(() => sleep(100, undefined));
		const spy2 = Sinon.spy(() => sleep(100, undefined));
		const spy3 = Sinon.spy(() => sleep(100, undefined));
		const spy4 = Sinon.spy(() => sleep(100, undefined));

		instance.add(spy1);
		instance.add(spy2);
		instance.add(spy3);

		Sinon.assert.calledOnce(spy1);
		Sinon.assert.calledOnce(spy2);
		Sinon.assert.notCalled(spy3);

		instance.updateParalell(1);
		instance.add(spy4);

		await clock?.tickAsync(50);

		Sinon.assert.notCalled(spy3);
		Sinon.assert.notCalled(spy4);

		await clock?.tickAsync(100);

		Sinon.assert.calledOnce(spy3);
		Sinon.assert.notCalled(spy4);

		await clock?.runAllAsync();
	});
});
