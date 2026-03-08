import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { PropertyStore } from "../../PropertyStore.js";
import { git } from "./CachedGit.js";

export async function getRevsFile(
	realFileName: string,
): Promise<string | undefined> {
	const possibleRevsFiles = PropertyStore.get("revsFile");
	if (possibleRevsFiles.length === 0) {
		return;
	}

	const gitRepo = await git.getRepositoryFolder(realFileName);

	if (!gitRepo) {
		return;
	}

	const projectRoot = dirname(gitRepo);
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
}
