import { commands, type Disposable, type ExtensionContext } from "vscode";

import { Extension } from "./git/extension.js";
import { Logger } from "./util/logger.js";

const registerCommand = (name: string, callback: () => void): Disposable => {
	return commands.registerCommand(`gitblame.${name}`, callback);
};

export const activate = (context: ExtensionContext): void => {
	const app = new Extension();

	context.subscriptions.push(
		app,
		Logger.getInstance(),
		registerCommand("quickInfo", () => {
			app.showMessage();
		}),
		registerCommand("online", () => {
			app.blameLink();
		}),
		registerCommand("addCommitHashToClipboard", () => {
			app.copyHash();
		}),
		registerCommand("addToolUrlToClipboard", () => {
			app.copyToolUrl();
		}),
		registerCommand("gitShow", () => {
			app.runGitShow();
		}),
	);

	app.updateView();
};
