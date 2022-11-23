import { commands, Disposable, ExtensionContext } from "vscode";

import { Extension } from "./git/extension";
import { Logger } from "./util/logger";

const registerCommand = (name: string, callback: () => void): Disposable => {
    return commands.registerCommand(`gitblame.${name}`, callback);
}

export const activate = (context: ExtensionContext): void => {
    const app = new Extension;

    context.subscriptions.push(
        app,
        Logger.getInstance(),
        registerCommand("quickInfo", () => {
            app.showMessage()
        }),
        registerCommand("online", () => {
            app.blameLink()
        }),
        registerCommand("addCommitHashToClipboard", () => {
            app.copyHash()
        }),
        registerCommand("addToolUrlToClipboard", () => {
            app.copyToolUrl()
        }),
    );
}
