import type { Extension } from "./extension.js";
import { getToolUrl } from "./git/get-tool-url.js";
import { errorMessage, infoMessage } from "./message.js";

export async function addToolUrlToClipboard(
	extension: Extension | undefined,
	addToClipboard: (send: string) => Thenable<void>,
): Promise<void> {
	const lineAware = await extension?.commit(false);
	if (lineAware === undefined) {
		await errorMessage("No commit to copy link from");
		return;
	}
	const toolUrl = await getToolUrl(lineAware);

	if (toolUrl) {
		await addToClipboard(toolUrl.toString());
		await infoMessage("Copied tool URL");
	} else {
		await errorMessage("gitblame.commitUrl config empty");
	}
}
