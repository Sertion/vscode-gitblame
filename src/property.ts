import { workspace } from "vscode";

export function getProperty(name: string): unknown {
	return workspace.getConfiguration("gitblame").get(name);
}
