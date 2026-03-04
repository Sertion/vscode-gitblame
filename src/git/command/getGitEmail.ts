import { git } from "./CachedGit.js";

export const getGitEmail = async (
	realFileName: string,
): Promise<string | undefined> => {
	const email = await git.run(realFileName, "config", "user.email");

	return email !== "" ? `<${email}>` : undefined;
};
