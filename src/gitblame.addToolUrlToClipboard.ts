import type { Extension } from "./extension.js";
import { getToolUrl } from "./git/get-tool-url.js";
import { errorMessage, infoMessage } from "./message.js";
import { t } from "./t.js";

export async function addToolUrlToClipboard(
	extension: Pick<Extension, "commit"> | undefined,
	addToClipboard: (send: string) => Thenable<void>,
): Promise<void> {
	const lineAware = await extension?.commit(false);
	if (lineAware === undefined) {
		await errorMessage(t("No commit to copy link from"));
		return;
	}
	const toolUrl = await getToolUrl(lineAware);

	if (toolUrl) {
		await addToClipboard(toolUrl.toString());
		await infoMessage(t("Copied tool URL"));
	} else {
		await errorMessage(
			t("{prop} config empty", {
				prop: "gitblame.commitUrl",
			}),
		);
	}
}
