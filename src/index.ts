import { commands, type Disposable, type ExtensionContext, env } from "vscode";
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

	const vscodeCommands = getvscode().then((e) => e?.commands);

	let app: Extension | undefined;

	await Promise.all<Disposable | undefined>([
		import("./extension.js").then((i) => {
			app = new i.Extension();
			app.updateView(getActiveTextEditor());
			return app;
		}),
		import("./logger.js").then((i) => i.Logger.createInstance()),
		vscodeCommands.then((e) =>
			e?.registerCommand("gitblame.quickInfo", () =>
				import("./gitblame.quickInfo.js").then((c) =>
					c.quickInfo(app, commands.executeCommand),
				),
			),
		),
		vscodeCommands.then((e) =>
			e?.registerCommand("gitblame.online", () =>
				import("./gitblame.online.js").then((c) =>
					c.online(app, commands.executeCommand),
				),
			),
		),
		vscodeCommands.then((e) =>
			e?.registerCommand("gitblame.addCommitHashToClipboard", () =>
				import("./gitblame.addCommitHashToClipboard.js").then((c) =>
					c.addCommitHashToClipboard(app, env.clipboard.writeText),
				),
			),
		),
		vscodeCommands.then((e) =>
			e?.registerCommand("gitblame.addToolUrlToClipboard", () =>
				import("./gitblame.addToolUrlToClipboard.js").then((c) =>
					c.addToolUrlToClipboard(app, env.clipboard.writeText),
				),
			),
		),
		vscodeCommands.then((e) =>
			e?.registerCommand("gitblame.gitShow", () =>
				import("./gitblame.gitShow.js").then((c) => c.gitShow(app)),
			),
		),
	]).then((disposables) =>
		context.subscriptions.push(...disposables.filter((e) => !!e)),
	);
}
