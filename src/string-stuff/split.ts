export function split(target: string, char = " "): [string, string] {
	const index = target.indexOf(char[0]);

	if (index === -1) {
		return [target, ""];
	}

	return [target.slice(0, index), target.slice(index + 1).trim()];
}

export function splitBuffer(
	target: Buffer,
	fromIndex: number,
	toIndex: number,
): [string, string] {
	// 32 is space
	const index = target.indexOf(32, fromIndex, "utf8");

	if (index === -1) {
		return [target.toString("utf8", fromIndex, toIndex), ""];
	}

	return [
		target.toString("utf8", fromIndex, index),
		target.toString("utf8", index + 1, toIndex),
	];
}
