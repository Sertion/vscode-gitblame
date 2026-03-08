import type { MessageItem } from "vscode";
import { getvscode } from "./vscode-quarantine.js";

export async function infoMessage<T extends MessageItem>(
	message: string,
	item: undefined | T[] = [],
): Promise<T | undefined> {
	return (await getvscode())?.window.showInformationMessage(message, ...item);
}

export async function errorMessage(
	message: string,
	...items: string[]
): Promise<string | undefined> {
	return (await getvscode())?.window.showErrorMessage(message, ...items);
}
