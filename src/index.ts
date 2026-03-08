import type { Disposable, ExtensionContext } from "vscode";
import { setvscodeForActiveTextEditor } from "./get-active.js";
import { setupCachedGit } from "./git/command/CachedGit.js";
import { PropertyStore } from "./PropertyStore.js";
import { getvscode } from "./vscode-quarantine.js";

async function registerCommand(
	name: string,
	callback: () => void,
): Promise<Disposable | undefined> {
	return (await getvscode())?.commands.registerCommand(
		`gitblame.${name}`,
		callback,
	);
}

export async function activate(context: ExtensionContext): Promise<void> {
	PropertyStore.createInstance();
	setvscodeForActiveTextEditor();
	await setupCachedGit();

	const Logger = (await import("./logger.js")).Logger;
	const app = new (await import("./extension.js")).Extension();

	context.subscriptions.push(app);

	Promise.all([
		Logger.createInstance(),
		registerCommand("quickInfo", () => void app.showMessage()),
		registerCommand("online", () => void app.blameLink()),
		registerCommand("addCommitHashToClipboard", () => void app.copyHash()),
		registerCommand("addToolUrlToClipboard", () => void app.copyToolUrl()),
		registerCommand("gitShow", () => void app.runGitShow()),
	]).then((disposables) =>
		context.subscriptions.push(...disposables.filter((e) => !!e)),
	);

	app.updateView();
}
