import * as assert from "node:assert";
import test, { before, suite } from "node:test";
import type { execute as executeType } from "../../src/git/command/execute.js";
import type { getGitCommand as getGitCommandType } from "../../src/git/command/git-command.js";
import { Logger } from "../../src/logger.js";

suite("Execute Command", (): void => {
	Logger.createInstance();
	let execute: typeof executeType;
	let getGitCommand: typeof getGitCommandType;
	before(async () => {
		execute = (await import("../../src/git/command/execute.js")).execute;
		getGitCommand = (await import("../../src/git/command/git-command.js"))
			.getGitCommand;
	});
	test("Simple command", async (): Promise<void> => {
		const gitCommand = getGitCommand();
		const commandResult = await execute(gitCommand, ["--version"]);

		assert.ok(commandResult);
	});

	test("Unavailable commands should throw", async (): Promise<void> => {
		assert.rejects(async () => await execute("not-a-real-command", []));
	});
});
