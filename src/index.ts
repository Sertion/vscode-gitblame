import type { Disposable, ExtensionContext } from "vscode";
import type { Extension } from "./extension.js";
import { setvscodeForActiveTextEditor } from "./get-active.js";
import { setupCachedGit } from "./git/command/CachedGit.js";
import { PropertyStore } from "./PropertyStore.js";
import { getvscode } from "./vscode-quarantine.js";

export async function activate(context: ExtensionContext): Promise<void> {
	await PropertyStore.createInstance();
	setvscodeForActiveTextEditor();
	await setupCachedGit();

	const commands = getvscode().then((e) => e?.commands);

	let app: Extension | undefined;

	await Promise.all<Disposable | undefined>([
		import("./extension.js").then((i) => {
			app = new i.Extension();
			app.updateView();
			return app;
		}),
		import("./logger.js").then((i) => i.Logger.createInstance()),
		commands.then((e) =>
			e?.registerCommand("gitblame.quickInfo", () => void app?.showMessage()),
		),
		commands.then((e) =>
			e?.registerCommand("gitblame.online", () => void app?.blameLink()),
		),
		commands.then((e) =>
			e?.registerCommand(
				"gitblame.addCommitHashToClipboard",
				() => void app?.copyHash(),
			),
		),
		commands.then((e) =>
			e?.registerCommand(
				"gitblame.addToolUrlToClipboard",
				() => void app?.copyToolUrl(),
			),
		),
		commands.then((e) =>
			e?.registerCommand("gitblame.gitShow", () => void app?.runGitShow()),
		),
	]).then((disposables) =>
		context.subscriptions.push(...disposables.filter((e) => !!e)),
	);
}
