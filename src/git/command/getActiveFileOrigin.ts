import { getActiveTextEditor } from "../../get-active.js";
import { validEditor } from "../../valid-editor.js";
import { git } from "./CachedGit.js";

export const getActiveFileOrigin = async (
	remoteName: string,
): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	return git.run(
		activeEditor.document.fileName,
		"ls-remote",
		"--get-url",
		remoteName,
	);
};
