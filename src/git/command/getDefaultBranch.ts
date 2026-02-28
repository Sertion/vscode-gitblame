import { getActiveTextEditor } from "../../get-active.js";
import { split } from "../../string-stuff/split.js";
import { validEditor } from "../../valid-editor.js";
import { git } from "./CachedGit.js";

export const getDefaultBranch = async (remote: string): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const rawRemoteDefaultBranch = await git.run(
		activeEditor.document.fileName,
		"rev-parse",
		"--abbrev-ref",
		`${remote}/HEAD`,
	);

	return split(rawRemoteDefaultBranch, "/")[1];
};
