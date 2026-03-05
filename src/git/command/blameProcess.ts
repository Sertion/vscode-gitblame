import { type ChildProcessByStdio, spawn } from "node:child_process";
import { dirname } from "node:path";
import type { Readable } from "node:stream";
import { Logger } from "../../logger.js";
import { getProperty } from "../../property.js";
import { getGitCommand } from "./git-command.js";

export function blameProcess(
	realpathFileName: string,
	revsFile: string | undefined,
): ChildProcessByStdio<null, Readable, Readable> {
	const args = ["blame", "-C", "--incremental", "--", realpathFileName];

	if (getProperty("ignoreWhitespace")) {
		args.splice(1, 0, "-w");
	}

	if (revsFile) {
		args.splice(1, 0, "-S", revsFile);
	}

	const cwd = dirname(realpathFileName);
	Logger.info(`"${getGitCommand()} ${args.join(" ")}" in ${cwd}`);

	return spawn(getGitCommand(), args, {
		cwd,
		stdio: ["ignore", null, null],
		env: {
			...process.env,
			LC_ALL: "C",
			GIT_PAGER: "cat",
		},
	});
}
