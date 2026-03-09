import { FileAttachedCommit } from "../src/git/FileAttachedCommit.js";
import type { LineAttachedCommit } from "../src/git/LineAttachedCommit.js";

export function getExampleCommit(
	currentUserEmail?: `<${string}>`,
): LineAttachedCommit {
	const fileCommit = FileAttachedCommit.Create(
		{},
		"60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
		"10 100 1",
	);
	fileCommit.setByKey("summary", "list_lru: introduce per-memcg lists");
	fileCommit.setByKey("filename", "directory/example.file");

	fileCommit.setByKey(
		"author-mail",
		"<vdavydov.dev@gmail.com>",
		currentUserEmail,
	);
	fileCommit.setByKey("author", "Vladimir Davydov");
	fileCommit.setByKey("author-time", "1423781950");
	fileCommit.setByKey("author-date", "1423781950");
	fileCommit.setByKey("author-tz", "-0800");

	fileCommit.setByKey(
		"committer-mail",
		"<torvalds@linux-foundation.org>",
		currentUserEmail,
	);
	fileCommit.setByKey("committer", "Linus Torvalds");
	fileCommit.setByKey("committer-time", "1423796049");
	fileCommit.setByKey("committer-date", "1423796049");
	fileCommit.setByKey("committer-tz", "-0800");

	return fileCommit.toLineAttachedCommits().next().value;
}
