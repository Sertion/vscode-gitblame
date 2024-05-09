import { workspace } from "vscode";

export type PropertiesMap = {
	commitUrl: string;
	remoteName: string;
	ignoreWhitespace: boolean;
	infoMessageFormat: string;
	statusBarMessageFormat: string;
	statusBarMessageNoCommit: string;
	statusBarPositionPriority: number | undefined;
	pluralWebPathSubstrings: string[] | undefined;
	statusBarMessageClickAction:
		| "Show info message"
		| "Open tool URL"
		| "Open git show"
		| "Copy hash to clipboard";
	inlineMessageFormat: string;
	inlineMessageNoCommit: string;
	inlineMessageEnabled: boolean;
	inlineMessageMargin: number;
	delayBlame: number;
	parallelBlames: number;
	revsFile: string[];
};

// getConfiguration has an unfortunate typing that does not
// take any possible default values into consideration.
export const getProperty = <Key extends keyof PropertiesMap>(
	name: Key,
): PropertiesMap[Key] =>
	workspace.getConfiguration("gitblame").get(name) as PropertiesMap[Key];
