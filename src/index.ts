import { commands, type Disposable, type ExtensionContext } from "vscode";
import { Extension } from "./extension.js";
import { Logger } from "./logger.js";

const registerCommand = (name: string, callback: () => void): Disposable => {
	return commands.registerCommand(`gitblame.${name}`, callback);
};

export function activate(context: ExtensionContext): void {
	const app = new Extension();

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
