import * as assert from "node:assert";

import { execute } from "../../src/util/execcommand.mjs";
import { getGitCommand } from "../../src/git/util/gitcommand.mjs";

suite("Execute Command", (): void => {
	test("Simple command", async (): Promise<void> => {
		const gitCommand = getGitCommand();
		const commandResult = await execute(gitCommand, ["--version"]);

		assert.ok(commandResult);
	});

	test("Unavalible command", async (): Promise<void> => {
		const commandResult = await execute("not-a-real-command", []);

		assert.strictEqual(commandResult, "");
	});
});
