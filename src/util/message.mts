import { MessageItem, window } from "vscode";

export const infoMessage = <T extends MessageItem>(
    message: string,
    item: undefined | T[] = [],
): Promise<T | undefined> => {
    return Promise.resolve(window.showInformationMessage(message, ...item));
}

export const errorMessage = (
    message: string,
    ...items: string[]
): Promise<string | undefined> => Promise.resolve(
    window.showErrorMessage(message, ...items),
);
