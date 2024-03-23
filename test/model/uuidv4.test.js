import { describe, test } from "node:test";
import { strictEqual, throws } from "node:assert";
import UuidV4 from "../../src/model/uuidv4.js";

const uuidV1 = "d9428888-122b-11e1-b85c-61cd3cbb3210";
const uuidV4_0 = "109156be-c4fb-41ea-b1b4-efe1671c5836";
const uuidV4_1 = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";

describe(`${UuidV4.name}`, () => {
	describe("constructor", () => {
		test("rejects invalid value parameter", async (t) => {
			for (const value of [undefined, null, 0, {}, [], new Set(), "", " ", "a", uuidV1]) {
				await t.test(
					`value ${typeof value} "${value}" expecting to throw error with descriptive validation message`,
					() => {
						throws(
							() => {
								new UuidV4(value);
							},
							new TypeError(`value must be a valid UUIDv4 string, was type ${typeof value} with value ${value}`),
						);
					},
				);
			}
		});

		test("accepts valid value parameter", async (t) => {
			for (const value of [uuidV4_0, uuidV4_1]) {
				await t.test(`value ${typeof value} "${value}" expecting new ${UuidV4.name} containing same value`, () => {
					const uuidV4 = new UuidV4(value);
					strictEqual(uuidV4.value, value);
					strictEqual(uuidV4.toString(), `${UuidV4.name} ${JSON.stringify(uuidV4.toJSON())}`);
				});
			}
		});
	});
});
