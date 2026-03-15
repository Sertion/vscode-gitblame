import type { Extension } from "vscode";
import type { GitExtension } from "../../../types/git.ts";
import { Logger } from "../../logger.js";
import { getvscode } from "../../vscode-quarantine.js";

let vscodeGit: Extension<GitExtension> | undefined;
export async function getGitCommand(): Promise<string> {
	try {
		vscodeGit ??= (await getvscode())?.extensions.getExtension<GitExtension>(
			"vscode.git",
		);

		if (vscodeGit?.exports.enabled) {
			return vscodeGit.exports.getAPI(1).git.path;
		}
	} catch {
		Logger.info(
			"`vscode.git` has not started yet or is not installed, falling back on `git.path` or `git` from $PATH. This is expected during startup",
		);
	}

	return (
		(await getvscode())?.workspace.getConfiguration("git").get("path") ?? "git"
	);
}
