import type { Extension } from "vscode";
import type { GitExtension } from "../../../types/git.ts";
import { getvscode } from "../../vscode-quarantine.js";

let vscodeGit: Extension<GitExtension> | undefined;
export async function getGitCommand(): Promise<string> {
	vscodeGit ??= (await getvscode())?.extensions.getExtension<GitExtension>(
		"vscode.git",
	);

	if (vscodeGit?.exports.enabled) {
		return vscodeGit.exports.getAPI(1).git.path;
	}

	return "git";
}
