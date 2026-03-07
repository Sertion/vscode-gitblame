export function projectNameFromOrigin(origin: string): string {
	const parts = origin.split("/");
	return parts.at(-1)?.replace(".git", "") ?? "";
}
