import { runGit } from "./git-command";

export const getGitFolder = async (fileName: string): Promise<string> =>
	runGit(fileName, "rev-parse", "--absolute-git-dir");
