import type { Extension } from "./extension.js";
import { getToolUrl } from "./git/get-tool-url.js";
import { errorMessage } from "./message.js";

export async function online(
	extension: Pick<Extension, "commit"> | undefined,
	executeCommand: (command: string, url: URL) => Thenable<void>,
): Promise<void> {
	const lineAware = await extension?.commit(false);
	if (lineAware === undefined) {
		await errorMessage("No commit to copy link from");
		return;
	}
	const toolUrl = await getToolUrl(lineAware);

	if (toolUrl) {
		await executeCommand("vscode.open", toolUrl);
	} else {
		await errorMessage("Empty gitblame.commitUrl");
	}
}
