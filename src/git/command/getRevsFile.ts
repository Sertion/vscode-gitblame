import { access } from "node:fs/promises";
import { dirname, join } from "node:path/posix";
import { getProperty } from "../../property";
import { getGitFolder } from "./getGitFolder";

export const getRevsFile = async (
	realFileName: string,
): Promise<string | undefined> => {
	const possibleRevsFiles = getProperty("revsFile");
	if (possibleRevsFiles.length === 0) {
		return undefined;
	}

	const gitRoot = await getGitFolder(realFileName);
	const projectRoot = dirname(gitRoot);
	const revsFiles = await Promise.allSettled(
		possibleRevsFiles
			.map((fileName) => join(projectRoot, fileName))
			.map((path) => access(path).then(() => path)),
	);

	return revsFiles.filter(
		(promise): promise is PromiseFulfilledResult<string> =>
			promise.status === "fulfilled",
	)[0]?.value;
};
