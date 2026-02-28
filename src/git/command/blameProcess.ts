import { type ChildProcess, spawn } from "node:child_process";
import { dirname } from "node:path/posix";
import { Logger } from "../../logger.js";
import { getProperty } from "../../property.js";
import { getGitCommand } from "./git-command.js";

export const blameProcess = (
	realpathFileName: string,
	revsFile: string | undefined,
): ChildProcess => {
	const args = ["blame", "-C", "--incremental", "--", realpathFileName];

	if (getProperty("ignoreWhitespace")) {
		args.splice(1, 0, "-w");
	}

	if (revsFile) {
		args.splice(1, 0, "-S", revsFile);
	}

	Logger.info(`${getGitCommand()} ${args.join(" ")}`);

	return spawn(getGitCommand(), args, {
		cwd: dirname(realpathFileName),
		stdio: ["ignore", null, null],
		env: {
			...process.env,
			LC_ALL: "C",
			GIT_PAGER: "cat",
		},
	});
};
