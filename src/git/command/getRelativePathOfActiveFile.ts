import { getActiveTextEditor } from "../../get-active.js";
import { validEditor } from "../../valid-editor.js";
import { runGit } from "./git-command.js";

export const getRelativePathOfActiveFile = async (): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const { fileName } = activeEditor.document;
	return runGit(fileName, "ls-files", "--full-name", "--", fileName);
};
