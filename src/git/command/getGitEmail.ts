import { dirname } from "node:path/posix";
import { runGit } from "./git-command";

export const getGitEmail = async (
	realFileName: string,
): Promise<string | undefined> => {
	const email = await runGit(dirname(realFileName), "config", "user.email");

	if (email === "") {
		return undefined;
	}

	return `<${email}>`;
};
