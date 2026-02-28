import { commands, type Disposable, type ExtensionContext } from "vscode";

import { Logger } from "./logger.js";

const registerCommand = (name: string, callback: () => void): Disposable => {
	return commands.registerCommand(`gitblame.${name}`, callback);
};

export function activate(context: ExtensionContext): void {
	const app = import("./extension.js").then(({ Extension }) => new Extension());

	context.subscriptions.push(
		{
			dispose: () => void app.then((e) => e.dispose()),
		},
		Logger.getInstance(),
		registerCommand("quickInfo", () => void app.then((e) => e.showMessage())),
		registerCommand("online", () => void app.then((e) => e.blameLink())),
		registerCommand(
			"addCommitHashToClipboard",
			() => void app.then((e) => e.copyHash()),
		),
		registerCommand(
			"addToolUrlToClipboard",
			() => void app.then((e) => e.copyToolUrl()),
		),
		registerCommand("gitShow", () => void app.then((e) => e.runGitShow())),
	);

	app.then((e) => e.updateView());
}
