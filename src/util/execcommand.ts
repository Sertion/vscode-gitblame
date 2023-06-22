import { ChildProcess, execFile, ExecOptions } from "node:child_process";

import { Logger } from "./logger.js";

export const execute = async (
	command: string,
	args: string[],
	options: ExecOptions = {},
): Promise<string> => {
	Logger.info(`${command} ${args.join(" ")}`);

	let execution: ChildProcess;

	try {
		execution = execFile(command, args, { ...options, encoding: "utf8" });
	} catch (err) {
		Logger.error(err);
		return "";
	}

	let data = "";

	for await (const chunk of execution?.stdout ?? []) {
		data += chunk;
	}

	return data.trim();
};
