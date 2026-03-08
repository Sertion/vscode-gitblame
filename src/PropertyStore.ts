import * as assert from "node:assert";
import type { getProperty } from "./property.js";

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
	currentUserAlias: string;
	delayBlame: number;
	parallelBlames: number;
	maxLineCount: number;
	revsFile: string[];
	extendedHoverInformation: "off" | "inline-status" | "inline" | "status";
};

export class PropertyStore {
	protected static instance: PropertyStore | undefined;
	public static async createInstance(
		getProperty?: (name: string) => unknown,
	): Promise<PropertyStore> {
		PropertyStore.instance = new PropertyStore(
			getProperty ?? (await import("./property.js")).getProperty,
		);
		return PropertyStore.instance;
	}
	public static get<Key extends keyof PropertiesMap>(
		name: Key,
	): PropertiesMap[Key] {
		assert.ok(
			PropertyStore.instance,
			"Unable to call PropertyStore.get before PropertyStore.createInstance",
		);
		return PropertyStore.instance?.getConfig(name);
	}

	protected constructor(private readonly source: typeof getProperty) {}

	protected getConfig<Key extends keyof PropertiesMap>(
		name: Key,
	): PropertiesMap[Key] {
		return this.source(name) as PropertiesMap[Key];
	}
}
