import { getActiveTextEditor } from "../../get-active.js";
import { validEditor } from "../../valid-editor.js";
import { git } from "./CachedGit.js";

export const getRemoteUrl = async (fallbackRemote: string): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const { fileName } = activeEditor.document;
	const currentBranch = await git.run(
		fileName,
		"symbolic-ref",
		"-q",
		"--short",
		"HEAD",
	);
	const curRemote = await git.run(
		fileName,
		"config",
		`branch.${currentBranch}.remote`,
	);
	return git.run(
		fileName,
		"config",
		`remote.${curRemote || fallbackRemote}.url`,
	);
};
