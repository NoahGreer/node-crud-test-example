import { describe, test } from "node:test";
import { strictEqual } from "node:assert";
import { isDate, isString } from "../../src/util/validation.js";

const testDate = () => new Date(2024, 3, 22, 2, 23, 0);

describe("Validation utility methods", () => {
	test(`${isDate.name} checks value parameter`, async (t) => {
		for (const [value, expectedResult] of [
			[undefined, false],
			[null, false],
			[{}, false],
			[[], false],
			[0, false],
			["", false],
			["Date", false],
			[new String(), false],
			[new Set(), false],
			[testDate(), true],
		]) {
			await t.test(`value ${typeof value} "${value}" expecting ${expectedResult}`, () => {
				strictEqual(isDate(value), expectedResult);
			});
		}
	});

	test(`${isString.name} checks value parameter`, async (t) => {
		for (const [value, expectedResult] of [
			[undefined, false],
			[null, false],
			[{}, false],
			[[], false],
			[0, false],
			[new Set(), false],
			[testDate(), false],
			[new String(), true],
			["", true],
			[" ", true],
			["a", true],
		]) {
			await t.test(`value ${typeof value} "${value}" expecting ${expectedResult}`, () => {
				strictEqual(isString(value), expectedResult);
			});
		}
	});
});
