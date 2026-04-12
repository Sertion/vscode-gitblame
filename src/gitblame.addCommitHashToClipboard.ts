import { env } from "vscode";
import type { Extension } from "./extension.js";
import { errorMessage, infoMessage } from "./message.js";

export async function addCommitHashToClipboard(
	extension: Extension | undefined,
): Promise<void> {
	const lineAware = await extension?.commit(false);

	if (lineAware?.commit.isCommitted()) {
		await env.clipboard.writeText(lineAware.commit.hash);
		await infoMessage("Copied hash");
	} else {
		await errorMessage("No commit to copy hash from");
	}
}
