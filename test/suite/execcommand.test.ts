import * as assert from "node:assert";
import { execute } from "../../src/git/command/execute.js";
import { getGitCommand } from "../../src/git/command/git-command.js";

suite("Execute Command", (): void => {
	test("Simple command", async (): Promise<void> => {
		const gitCommand = getGitCommand();
		const commandResult = await execute(gitCommand, ["--version"]);

		assert.ok(commandResult);
	});

	test("Unavailable command", async (): Promise<void> => {
		const commandResult = await execute("not-a-real-command", []);

		assert.strictEqual(commandResult, "");
	});
});
