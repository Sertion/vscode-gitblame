import assert from "node:assert";
import test, { afterEach, mock, suite } from "node:test";
import { Logger } from "../../src/logger.js";

suite("Logger", () => {
	afterEach(() => {
		Logger.getInstance().dispose();
	});

	test("Can get instance", async () => {
		assert.ok((await Logger.createInstance()) instanceof Logger);
	});

	test("Is singleton", async () => {
		assert.strictEqual(await Logger.createInstance(), Logger.getInstance());
	});

	test("Can log different levels", async () => {
		const trace = mock.fn();
		const debug = mock.fn();
		const info = mock.fn();
		const error = mock.fn();
		await Logger.createInstance({ trace, debug, info, error });

		Logger.trace("trace-message");
		Logger.debug("debug-message");
		Logger.info("info-message");
		Logger.error(new Error("new-error-message"));

		assert.strictEqual(trace.mock.callCount(), 1);
		assert.strictEqual(debug.mock.callCount(), 1);
		assert.strictEqual(info.mock.callCount(), 1);
		assert.strictEqual(error.mock.callCount(), 1);
	});

	test("Error does nog log unless Error instance", async () => {
		const error = mock.fn();
		await Logger.createInstance({ error });

		Logger.error("string");
		Logger.error("");
		Logger.error(0);
		Logger.error(false);
		Logger.error(Symbol.for("Error"));

		assert.strictEqual(error.mock.callCount(), 0);
	})
});
