import { dirname } from "node:path";
import { l10n, type Terminal, type TerminalOptions } from "vscode";
import type { Extension } from "./extension.js";
import { getActiveTextEditor } from "./get-active.js";
import { Commit } from "./git/Commit.js";
import { errorMessage } from "./message.js";
import { PropertyStore } from "./PropertyStore.js";
import { validEditor } from "./valid-editor.js";

export async function gitShow(
	extension: Pick<Extension, "commit"> | undefined,
	createTerminal: (
		options: TerminalOptions,
	) => Pick<Terminal, "show" | "sendText">,
): Promise<void> {
	const editor = getActiveTextEditor();

	if (!validEditor(editor)) {
		void errorMessage(l10n.t("Unable to show git when no editor is active."));
		return;
	}

	const currentLine = await extension?.commit(false);
	if (currentLine === undefined) {
		void errorMessage(l10n.t("Unable to get commit for current file/line."));
		return;
	}
	const { hash } = currentLine.commit;

	// Only ever allow things we know git could give as output
	if (hash !== "HEAD" && !Commit.IsHash(hash)) {
		void errorMessage(
			l10n.t("Got invalid git reference value for 'git show'. Aborting."),
		);
		return;
	}

	const ignoreWhitespace = PropertyStore.get("ignoreWhitespace") ? "-w " : "";
	const terminal = createTerminal({
		name: l10n.t("Git Blame: git show {hash}", { hash }),
		iconPath: { id: "git-commit" },
		isTransient: true,
		cwd: dirname(editor.document.fileName),
	});
	terminal.sendText(`git show ${ignoreWhitespace}${hash}; exit 0`, true);
	terminal.show();
}
