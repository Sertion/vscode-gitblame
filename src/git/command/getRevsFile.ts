import { access } from "node:fs/promises";
import { dirname, join } from "node:path";

import { getProperty } from "../../property.js";
import { git } from "./CachedGit.js";

export const getRevsFile = async (
	realFileName: string,
): Promise<string | undefined> => {
	const possibleRevsFiles = getProperty("revsFile");
	if (possibleRevsFiles.length === 0) {
		return;
	}

	const projectRoot = dirname(await git.getRepositoryFolder(realFileName));
	const revsFiles = await Promise.allSettled(
		possibleRevsFiles.map(async (fileName) => {
			const path = join(projectRoot, fileName);
			await access(path);
			return path;
		}),
	);

	return revsFiles.find(
		(promise): promise is PromiseFulfilledResult<string> =>
			promise.status === "fulfilled",
	)?.value;
};
