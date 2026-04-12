import { commands, type MessageItem } from "vscode";
import type { Extension } from "./extension.js";
import { getActiveTextEditor } from "./get-active.js";
import { getToolUrl } from "./git/get-tool-url.js";
import { gitShow } from "./gitblame.gitShow.js";
import { infoMessage } from "./message.js";
import { PropertyStore } from "./PropertyStore.js";
import {
	normalizeCommitInfoTokens,
	parseTokens,
} from "./string-stuff/text-decorator.js";

type ActionableMessageItem = MessageItem & {
	action: () => void;
};

export async function quickInfo(
	extension: Extension | undefined,
): Promise<void> {
	if (extension === undefined) {
		return;
	}
	const lineAware = await extension.commit(true);

	if (!lineAware?.commit.isCommitted()) {
		extension.view.clear();
		return;
	}

	const actions: ActionableMessageItem[] = [
		{ title: "Terminal", action: () => gitShow(extension) },
	];

	const toolUrl = await getToolUrl(lineAware);
	if (toolUrl) {
		actions.unshift({
			title: "Online",
			action: () => commands.executeCommand("vscode.open", toolUrl),
		});
	}

	extension.view.set(lineAware.commit, getActiveTextEditor());

	const selected = await infoMessage(
		parseTokens(
			PropertyStore.get("infoMessageFormat"),
			normalizeCommitInfoTokens(lineAware.commit),
		),
		actions,
	);

	selected?.action();
}
