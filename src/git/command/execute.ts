import { type ExecOptions, execFile } from "node:child_process";

import { Logger } from "../../logger.js";

export const execute = async (
	command: string,
	args: string[],
	options: ExecOptions = {},
): Promise<string> => {
	if (options.cwd) {
		Logger.info(`"${command} ${args.join(" ")}" in ${options.cwd}`);
	} else {
		Logger.info(`"${command} ${args.join(" ")}"`);
	}

	return new Promise((resolve, reject) =>
		execFile(
			command,
			args,
			{ ...options, encoding: "utf8" },
			(error, stdout, stderr): void => {
				if (error || stderr) {
					reject(error || stderr);
				} else {
					resolve(stdout.trim());
				}
			},
		),
	);
};
