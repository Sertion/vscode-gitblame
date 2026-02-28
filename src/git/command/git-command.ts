import { extensions } from "vscode";

import type { GitExtension } from "../../../types/git.js";

export const getGitCommand = (): string => {
	const vscodeGit = extensions.getExtension<GitExtension>("vscode.git");

	if (vscodeGit?.exports.enabled) {
		return vscodeGit.exports.getAPI(1).git.path;
	}

	return "git";
};
