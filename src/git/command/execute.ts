import { type ExecOptions, execFile } from "node:child_process";

import { Logger } from "../../logger.js";

export async function execute(
	command: string | Promise<string>,
	args: string[],
	options: ExecOptions = {},
): Promise<string> {
	const commandPath = await command;
	if (options.cwd) {
		Logger.info(`"${commandPath} ${args.join(" ")}" in ${options.cwd}`);
	} else {
		Logger.info(`"${commandPath} ${args.join(" ")}"`);
	}

	const { promise, resolve, reject } = Promise.withResolvers<string>();
	execFile(
		commandPath,
		args,
		{ ...options, encoding: "utf8" },
		(error, stdout, stderr): void => {
			if (error || stderr) {
				reject(error || stderr);
			} else {
				resolve(stdout.trim());
			}
		},
	);
	return promise;
}
