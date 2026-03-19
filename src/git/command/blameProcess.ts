import { type ChildProcessByStdio, spawn } from "node:child_process";
import { dirname } from "node:path";
import type { Readable } from "node:stream";
import { Logger } from "../../logger.js";
import { PropertyStore } from "../../PropertyStore.js";
import { getGitCommand } from "./git-command.js";

export type BlameProcess = Pick<
	ChildProcessByStdio<null, Readable, Readable>,
	"kill" | "stderr" | "stdout"
>;

export async function blameProcess(
	realpathFileName: string,
	revsFile: string | undefined,
): Promise<BlameProcess> {
	const extraArgs: string[] = [];

	if (PropertyStore.get("ignoreWhitespace")) {
		extraArgs.push("-w");
	}

	if (revsFile) {
		extraArgs.push("-S", revsFile);
	}

	const moveCount = PropertyStore.get("detectMoveOrCopyFromOtherFiles");
	const cCount = Number.isInteger(moveCount) ? moveCount : 0;
	for (let i = 0; i < cCount; i++) {
		extraArgs.push("-C");
	}

	const args = ["blame", ...extraArgs, "--incremental", "--", realpathFileName];

	const cwd = dirname(realpathFileName);
	const command = await getGitCommand();
	Logger.info(`"${command} ${args.join(" ")}" in ${cwd}`);

	return spawn(command, args, {
		cwd,
		stdio: ["ignore", null, null],
		env: {
			...process.env,
			LC_ALL: "C",
			GIT_PAGER: "cat",
		},
	});
}
