import { l10n } from "vscode";
import type { Extension } from "./extension.js";
import { getToolUrl } from "./git/get-tool-url.js";
import { errorMessage, infoMessage } from "./message.js";

export async function addToolUrlToClipboard(
	extension: Pick<Extension, "commit"> | undefined,
	addToClipboard: (send: string) => Thenable<void>,
): Promise<void> {
	const lineAware = await extension?.commit(false);
	if (lineAware === undefined) {
		await errorMessage(l10n.t("No commit to copy link from"));
		return;
	}
	const toolUrl = await getToolUrl(lineAware);

	if (toolUrl) {
		await addToClipboard(toolUrl.toString());
		await infoMessage(l10n.t("Copied tool URL"));
	} else {
		await errorMessage(l10n.t("gitblame.commitUrl config empty"));
	}
}
