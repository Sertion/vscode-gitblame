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
	const userArgs = PropertyStore.get("gitBlameArgs");
	const args = ["blame", ...userArgs, "--incremental", "--", realpathFileName];

	if (PropertyStore.get("ignoreWhitespace")) {
		args.splice(1, 0, "-w");
	}

	if (revsFile) {
		args.splice(1, 0, "-S", revsFile);
	}

	if (PropertyStore.get("detectMoveOrCopyFromOtherFiles")) {
		args.splice(1, 0, "-C");
	}

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
