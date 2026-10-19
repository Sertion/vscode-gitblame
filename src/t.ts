let func: {
	(message: string, ...args: Array<string | number | boolean>): string;
	(message: string, args: Record<string, string | number | boolean>): string;
	(options: {
		message: string;
		args?:
			| Array<string | number | boolean>
			| Record<string, string | number | boolean>;
		comment: string | string[];
	}): string;
};
try {
	func =
		(await import("vscode"))?.l10n?.t ?? ((..._args: unknown[]) => undefined);
} catch {
	func = () => undefined;
}

export const t = func;
