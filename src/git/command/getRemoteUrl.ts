import { getActiveTextEditor } from "../../get-active";
import { validEditor } from "../../valid-editor";
import { runGit } from "./git-command";

export const getRemoteUrl = async (fallbackRemote: string): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const { fileName } = activeEditor.document;
	const currentBranch = await runGit(
		fileName,
		"symbolic-ref",
		"-q",
		"--short",
		"HEAD",
	);
	const curRemote = await runGit(
		fileName,
		"config",
		`branch.${currentBranch}.remote`,
	);
	return runGit(
		fileName,
		"config",
		`remote.${curRemote || fallbackRemote}.url`,
	);
};
