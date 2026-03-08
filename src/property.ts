import { workspace } from "vscode";

export const getProperty = (name: string): unknown =>
	workspace.getConfiguration("gitblame").get(name);
