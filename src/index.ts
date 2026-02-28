import { commands, type Disposable, type ExtensionContext } from "vscode";

import { Logger } from "./logger.js";

const registerCommand = (name: string, callback: () => void): Disposable => {
	return commands.registerCommand(`gitblame.${name}`, callback);
};

export async function activate(context: ExtensionContext): Promise<void> {
	const app = new (await import("./extension.js")).Extension();

	context.subscriptions.push(
		app,
		Logger.getInstance(),
		registerCommand("quickInfo", () => void app.showMessage()),
		registerCommand("online", () => void app.blameLink()),
		registerCommand("addCommitHashToClipboard", () => void app.copyHash()),
		registerCommand("addToolUrlToClipboard", () => void app.copyToolUrl()),
		registerCommand("gitShow", () => void app.runGitShow()),
	);

	app.updateView();
}
