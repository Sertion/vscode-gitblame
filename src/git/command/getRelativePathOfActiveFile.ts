import { getActiveTextEditor } from "../../get-active.js";
import { validEditor } from "../../valid-editor.js";
import { git } from "./CachedGit.js";

export const getRelativePathOfActiveFile = async (): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const { fileName } = activeEditor.document;
	return git.run(fileName, "ls-files", "--full-name", "--", fileName);
};
