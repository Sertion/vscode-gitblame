import { ChildProcess, execFile, ExecOptions } from "node:child_process";

import { Logger } from "./logger.js";

export const execute = async (
	command: string,
	args: string[],
	options: ExecOptions = {},
): Promise<string> => {
	Logger.info(`${command} ${args.join(" ")}`);

	return new Promise((resolve) =>
		execFile(
			command,
			args,
			{ ...options, encoding: "utf8" },
			(error, stdout, stderr): void => {
				if (error || stderr) {
					Logger.error(error || stderr);
					resolve("");
				} else {
					resolve(stdout.trim());
				}
			},
		),
	);
};
