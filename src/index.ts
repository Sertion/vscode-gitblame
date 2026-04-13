import type { Disposable, ExtensionContext } from "vscode";
import type { Extension } from "./extension.js";
import {
	getActiveTextEditor,
	setvscodeForActiveTextEditor,
} from "./get-active.js";
import { setupCachedGit } from "./git/command/CachedGit.js";
import { PropertyStore } from "./PropertyStore.js";
import { getvscode } from "./vscode-quarantine.js";

export async function activate(context: ExtensionContext): Promise<void> {
	await PropertyStore.createInstance();
	setvscodeForActiveTextEditor();
	await setupCachedGit();

	const vscode = await getvscode();

	const executeCommand = async (command: string, url: URL): Promise<void> => {
		if (vscode) {
			vscode.commands.executeCommand(command, vscode.Uri.parse(url.toString()));
		}
	};

	let app: Extension | undefined;

	await Promise.all([
		import("./extension.js").then((i) => {
			app = new i.Extension();
			app.updateView(getActiveTextEditor());
			return app;
		}),
		import("./logger.js").then((i) => i.Logger.createInstance()),
	]).then((disposables) =>
		context.subscriptions.push(...disposables.filter((e) => !!e)),
	)

	context.subscriptions.push(...[
		vscode?.commands?.registerCommand("gitblame.quickInfo", () =>
			import("./gitblame.quickInfo.js").then((c) => {
				if (vscode) {
					c.quickInfo(app, executeCommand, vscode.window.createTerminal);
				}
			}),
		),
		vscode?.commands?.registerCommand("gitblame.online", () =>
			import("./gitblame.online.js").then((c) => c.online(app, executeCommand)),
		),
		vscode?.commands?.registerCommand("gitblame.addCommitHashToClipboard", () =>
			import("./gitblame.addCommitHashToClipboard.js").then((c) => {
				if (vscode) {
					c.addCommitHashToClipboard(app, vscode.env.clipboard.writeText);
				}
			}),
		),
		vscode?.commands?.registerCommand("gitblame.addToolUrlToClipboard", () =>
			import("./gitblame.addToolUrlToClipboard.js").then((c) => {
				if (vscode) {
					c.addToolUrlToClipboard(app, vscode.env.clipboard.writeText);
				}
			}),
		),
		vscode?.commands?.registerCommand("gitblame.gitShow", () =>
			import("./gitblame.gitShow.js").then((c) => {
				if (vscode) {
					c.gitShow(app, vscode.window.createTerminal);
				}
			}),
		),
	].filter((e) => !!e));
}
