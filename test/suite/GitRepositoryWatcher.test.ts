import assert from "node:assert";
import { randomUUID } from "node:crypto";
import type { FileChangeInfo } from "node:fs/promises";
import test, { afterEach, beforeEach, type Mock, mock, suite } from "node:test";
import { scheduler } from "node:timers/promises";
import type { GitRepositoryWatcher as GitRepositoryWatcherType } from "../../src/git/GitRepositoryWatcher.js";
import { Logger, type LoggerPipe } from "../../src/logger.js";

suite("GitRepositoryWatcher", async () => {
	let GitRepositoryWatcher: typeof GitRepositoryWatcherType;

	let loggerPipe: LoggerPipe;
	let fsMock: ReturnType<typeof mock.module>;
	let promise: Promise<FileChangeInfo<string>>;
	let resolve: (val: FileChangeInfo<string>) => void;
	let reject: (val: string) => void;

	beforeEach(async () => {
		loggerPipe = {
			debug: mock.fn() as (e: string) => void ,
		};
		Logger.createInstance(loggerPipe);
		const wResolvers = Promise.withResolvers<FileChangeInfo<string>>();
		promise = wResolvers.promise;
		resolve = wResolvers.resolve;
		reject = wResolvers.reject;
		fsMock = mock.module(`node:fs/promises?${randomUUID()}}`, {
			namedExports: {
				watch: async function* (): AsyncIterable<FileChangeInfo<string>> {
					yield await promise;
				},
			},
		});
		GitRepositoryWatcher = (
			await import(`../../src/git/GitRepositoryWatcher.js?${randomUUID()}}`)
		).GitRepositoryWatcher;
	});

	afterEach(() => {
		resolve({
			eventType: "change",
			filename: "file",
		});
		fsMock.restore();
	});

	test("create instance", () => {
		assert.ok(new GitRepositoryWatcher("") instanceof GitRepositoryWatcher);
	});

	test("should be able to add repository", async () => {
		const instance = new GitRepositoryWatcher("file");

		assert.strictEqual(
			await instance.addRepository("/git/repository/path/.git"),
			"/git/repository/path/.git",
		);

		// And for windows and their non key sensitive drive letters
		assert.strictEqual(
			await instance.addRepository("c:\\git\\repository\\path\\.git"),
			"C:\\git\\repository\\path\\.git",
		);

		assert.strictEqual(
			await instance.addRepository("C:\\git\\repository\\path\\.git"),
			"C:\\git\\repository\\path\\.git",
		);
	});

	test("should call callback on watch event", async () => {
		const instance = new GitRepositoryWatcher("file");
		const fn = mock.fn();

		instance.onChange(fn);

		await instance.addRepository("/git/repository/path/.git");

		resolve({ eventType: "change", filename: "change-file-name" });

		await scheduler.yield();

		assert.strictEqual(fn.mock.callCount(), 1);
		assert.deepStrictEqual(fn.mock.calls[0].arguments, [
			{
				gitRoot: "/git/repository/path/.git",
				repositoryRoot: "/git/repository/path",
			},
		]);
	});

	test("should handle watch error without crashing", async () => {
		const instance = new GitRepositoryWatcher("file");

		await instance.addRepository("/git/repository/path/.git");

		reject("test error");

		await scheduler.yield();

		// One for created and one for failure
		assert.strictEqual(
			(loggerPipe.debug as Mock<() => void>).mock.callCount(),
			2,
		);
	});
});
