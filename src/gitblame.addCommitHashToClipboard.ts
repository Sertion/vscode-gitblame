import type { Extension } from "./extension.js";
import { errorMessage, infoMessage } from "./message.js";

export async function addCommitHashToClipboard(
	extension: Pick<Extension, "commit"> | undefined,
	addToClipboard: (send: string) => Thenable<void>,
): Promise<void> {
	const lineAware = await extension?.commit(false);

	if (lineAware?.commit.isCommitted()) {
		await addToClipboard(lineAware.commit.hash);
		await infoMessage("Copied hash");
	} else {
		await errorMessage("No commit to copy hash from");
	}
}
