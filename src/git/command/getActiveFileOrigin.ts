import { getActiveTextEditor } from "../../get-active.js";
import { validEditor } from "../../valid-editor.js";
import { runGit } from "./git-command";

export const getActiveFileOrigin = async (
	remoteName: string,
): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	return runGit(
		activeEditor.document.fileName,
		"ls-remote",
		"--get-url",
		remoteName,
	);
};
