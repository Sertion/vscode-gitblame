import type * as Quarantined from "vscode";

let vscode: typeof Quarantined | undefined | null = null;

export async function getvscode(): Promise<typeof Quarantined | undefined> {
	if (vscode === null) {
		vscode = await import("vscode").catch(() => undefined);
	}
	return vscode;
}
