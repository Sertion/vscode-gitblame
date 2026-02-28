import { getActiveTextEditor } from "../../get-active";
import { split } from "../../string-stuff/split";
import { validEditor } from "../../valid-editor";
import { runGit } from "./git-command";

export const getDefaultBranch = async (remote: string): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const rawRemoteDefaultBranch = await runGit(
		activeEditor.document.fileName,
		"rev-parse",
		"--abbrev-ref",
		`${remote}/HEAD`,
	);

	return split(rawRemoteDefaultBranch, "/")[1];
};
