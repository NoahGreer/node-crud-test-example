import { describe, test } from "node:test";
import { strictEqual, throws } from "node:assert";
import { NoteForCreate, NoteForUpdate, Note } from "../../src/model/note.js";
import UuidV4 from "../../src/model/uuidv4.js";

const id = new UuidV4("109156be-c4fb-41ea-b1b4-efe1671c5836");
const content = "";
// Using factory methods because Dates are mutable and mutable data may accidentally produce interdependant tests
const creationDateTimeFactory = () => new Date(2024, 3 - 1, 22, 2, 23, 0);
const lastUpdatedDateTimeFactory = () => new Date(2024, 3 - 1, 22, 2, 23, 1);

describe(`${NoteForCreate.name}`, () => {
	describe("constructor", () => {
		test("rejects invalid content parameter", async (t) => {
			for (const content of [undefined, null, 0, {}, [], new Set(), creationDateTimeFactory()]) {
				await t.test(
					`${typeof content} "${content}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						throws(
							() => {
								new NoteForCreate(content);
							},
							new TypeError(`content must be a string, was type ${typeof content} with value ${content}`),
						);
					},
				);
			}
		});

		test("accepts valid content parameter", async (t) => {
			for (const content of ["", " ", "content"]) {
				await t.test(
					`${typeof content} "${content}" expecting new ${NoteForCreate.name} containing same content`,
					() => {
						const noteForCreate = new NoteForCreate(content);
						strictEqual(noteForCreate.content, content);
						strictEqual(noteForCreate.toString(), `${NoteForCreate.name} ${JSON.stringify(noteForCreate.toJSON())}`);
					},
				);
			}
		});
	});
});

describe(`${NoteForUpdate.name}`, () => {
	describe("constructor", () => {
		test("rejects invalid id parameter", async (t) => {
			for (const id of [undefined, null, 0, {}, [], new Set(), creationDateTimeFactory()]) {
				await t.test(
					`${typeof id} "${id}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						throws(
							() => {
								new NoteForUpdate(id, content);
							},
							new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`),
						);
					},
				);
			}
		});

		test("rejects invalid content parameter", async (t) => {
			for (const content of [undefined, null, 0, {}, [], new Set(), creationDateTimeFactory()]) {
				await t.test(
					`${typeof content} "${content}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						throws(
							() => {
								new NoteForUpdate(id, content);
							},
							new TypeError(`content must be a string, was type ${typeof content} with value ${content}`),
						);
					},
				);
			}
		});

		test("accepts valid id and content parameters", async (t) => {
			const validId = id;
			for (const [id, content] of [
				[validId, ""],
				[validId, " "],
				[validId, "content"],
			]) {
				await t.test(
					`id ${typeof id} "${id}", content ${typeof content} "${content}" parameters expecting new ${NoteForUpdate.name} with matching fields`,
					() => {
						const noteForUpdate = new NoteForUpdate(id, content);

						strictEqual(noteForUpdate.id, id);
						strictEqual(noteForUpdate.content, content);
						strictEqual(noteForUpdate.toString(), `${NoteForUpdate.name} ${JSON.stringify(noteForUpdate.toJSON())}`);
					},
				);
			}
		});
	});
});

describe(`${Note.name}`, () => {
	describe("constructor", () => {
		test(`rejects invalid id parameter`, async (t) => {
			for (const id of [undefined, null, 0, {}, [], new Set(), creationDateTimeFactory()]) {
				await t.test(
					`${typeof id} "${id}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						const creationDateTime = creationDateTimeFactory();
						const lastUpdatedDateTime = lastUpdatedDateTimeFactory();

						throws(
							() => {
								new Note(id, content, creationDateTime, lastUpdatedDateTime);
							},
							new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`),
						);
					},
				);
			}
		});

		test(`rejects invalid content parameter`, async (t) => {
			for (const content of [undefined, null, 0, {}, [], new Set(), creationDateTimeFactory()]) {
				await t.test(
					`${typeof content} "${content}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						const creationDateTime = creationDateTimeFactory();
						const lastUpdatedDateTime = lastUpdatedDateTimeFactory();

						throws(
							() => {
								new Note(id, content, creationDateTime, lastUpdatedDateTime);
							},
							new TypeError(`content must be a string, was type ${typeof content} with value ${content}`),
						);
					},
				);
			}
		});

		test(`rejects invalid creationDateTime parameter`, async (t) => {
			for (const creationDateTime of [undefined, null, 0, {}, [], new Set()]) {
				await t.test(
					`${typeof creationDateTime} "${creationDateTime}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						const lastUpdatedDateTime = lastUpdatedDateTimeFactory();

						throws(
							() => {
								new Note(id, content, creationDateTime, lastUpdatedDateTime);
							},
							new TypeError(
								`creationDateTime must be a ${Date.name} object, was ${typeof creationDateTime} ${creationDateTime}`,
							),
						);
					},
				);
			}
		});

		test(`rejects invalid lastUpdatedDateTime parameter`, async (t) => {
			for (const lastUpdatedDateTime of [undefined, null, 0, {}, [], new Set()]) {
				await t.test(
					`${typeof lastUpdatedDateTime} "${lastUpdatedDateTime}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						const creationDateTime = creationDateTimeFactory();

						throws(
							() => {
								new Note(id, content, creationDateTime, lastUpdatedDateTime);
							},
							new TypeError(
								`lastUpdatedDateTime must be a ${Date.name} object, was ${typeof lastUpdatedDateTime} ${lastUpdatedDateTime}`,
							),
						);
					},
				);
			}
		});

		test(`accepts valid id and content parameters`, async (t) => {
			const validId = id;
			for (const [id, content] of [
				[validId, ""],
				[validId, " "],
				[validId, "content"],
			]) {
				await t.test(
					`id ${typeof id} "${id}" content ${typeof content} "${content}" expecting new ${Note.name} with matching fields`,
					() => {
						const creationDateTime = creationDateTimeFactory();
						const lastUpdatedDateTime = lastUpdatedDateTimeFactory();

						const note = new Note(id, content, creationDateTime, lastUpdatedDateTime);

						strictEqual(note.id, id);
						strictEqual(note.content, content);
						strictEqual(note.creationDateTime.getTime(), creationDateTime.getTime());
						strictEqual(note.lastUpdatedDateTime.getTime(), lastUpdatedDateTime.getTime());
						strictEqual(note.toString(), `${Note.name} ${JSON.stringify(note.toJSON())}`);
					},
				);
			}
		});
	});
});
