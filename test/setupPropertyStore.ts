// biome-ignore lint/correctness/useImportExtensions: biome does not know what json is
import packageImport from "../package.json" with { type: "json" };
import { type PropertiesMap, PropertyStore } from "../src/PropertyStore.js";
import type { getProperty } from "../src/property.js";

class MockedPropertyStore extends PropertyStore {
	private overrides: Partial<PropertiesMap>;

	public constructor(source: typeof getProperty) {
		super(source);
		this.overrides = {};
		PropertyStore.instance = this;
	}

	public setOverride<Key extends keyof PropertiesMap>(
		key: Key,
		value: PropertiesMap[Key],
	): void {
		this.overrides[key] = value;
	}

	public clearOverrides(): void {
		this.overrides = {};
	}

	protected getConfig<Key extends keyof PropertiesMap>(
		name: Key,
	): PropertiesMap[Key] {
		return this.overrides[name] ?? super.getConfig(name);
	}
}

export async function setupPropertyStore(): Promise<MockedPropertyStore> {
	const properties: Record<string, unknown> = {};
	for (const [key, prop] of Object.entries(
		packageImport.contributes.configuration.properties,
	)) {
		properties[key.replace("gitblame.", "")] = prop.default;
	}

	return new MockedPropertyStore((key) => properties[key]);
}
