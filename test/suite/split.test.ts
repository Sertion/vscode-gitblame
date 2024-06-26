import * as assert from "node:assert";
import { split } from "../../src/util/split.js";

suite("Split", (): void => {
	test("Single Space", (): void => {
		assert.deepStrictEqual(split("single space"), ["single", "space"]);
	});
	test("Multiple Spaces", (): void => {
		assert.deepStrictEqual(split("multiple spaces in this test right here"), [
			"multiple",
			"spaces in this test right here",
		]);
	});
	test("No Spaces", (): void => {
		assert.deepStrictEqual(split("oneword"), ["oneword", ""]);
	});
	test("Trim results", (): void => {
		assert.deepStrictEqual(split("trim    result   "), ["trim", "result"]);
	});
	test("Single Ampersand", (): void => {
		assert.deepStrictEqual(split("single&ampersand", "&"), [
			"single",
			"ampersand",
		]);
	});
	test("Short second parameter", (): void => {
		assert.deepStrictEqual(split("bad second argument", ""), [
			"bad second argument",
			"",
		]);
	});
	test("Long second parameter", (): void => {
		assert.deepStrictEqual(split("bad second argument long", "long"), [
			"bad second argument ",
			"ong",
		]);
	});
});
