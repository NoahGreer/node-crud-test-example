import { beforeEach, describe, test } from "node:test";
import { throws } from "node:assert";
import BetterSqlite3 from "better-sqlite3";
import Database from "better-sqlite3";
import NoteService from "../../src/service/note-service.js";
import NoteDao from "../../src/dao/note-dao.js";
import { NoteForCreate, NoteForUpdate } from "../../src/model/note.js";
import UuidV4 from "../../src/model/uuidv4.js";

describe(`${NoteService.name}`, () => {
	/**
	 * @type {BetterSqlite3.Database}
	 */
	const databaseConnectionStub = Object.create(Database.prototype);
	/**
	 * @type {NoteDao}
	 */
	const noteDaoStub = Object.create(NoteDao.prototype);

	/**
	 * @type {NoteService}
	 */
	let noteService;

	beforeEach(() => {
		noteService = new NoteService(databaseConnectionStub, noteDaoStub);
	});

	describe("constructor", () => {
		test("rejects invalid noteDao parameter value", async (t) => {
			for (const noteDao of [undefined, null, {}, [], new Set(), "", " ", "a"]) {
				await t.test(
					`${typeof noteDao} "${noteDao}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						throws(
							() => {
								new NoteService(databaseConnectionStub, noteDao);
							},
							new TypeError(
								`noteDao must be an instance of ${NoteDao.name}, was type ${typeof noteDao} with value ${noteDao}`,
							),
						);
					},
				);
			}
		});

		test("rejects invalid databaseConnection parameter value", async (t) => {
			for (const databaseConnection of [undefined, null, {}, [], new Set(), "", " ", "a"]) {
				await t.test(
					`${typeof databaseConnection} "${databaseConnection}" expecting to throw ${TypeError.name} with descriptive validation message`,
					() => {
						throws(
							() => {
								new NoteService(databaseConnection, noteDaoStub);
							},
							new TypeError(
								`databaseConnection must be an instance of ${Database.name}, was type ${typeof databaseConnection} with value ${databaseConnection}`,
							),
						);
					},
				);
			}
		});
	});

	test(`${NoteService.prototype.create.name} method rejects invalid note parameter value`, async (t) => {
		for (const note of [undefined, null, {}, [], new Set(), "", " ", "a"]) {
			await t.test(
				`${typeof note} "${note}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							noteService.create(note);
						},
						new TypeError(
							`note must be an instance of ${NoteForCreate.name}, was type ${typeof note} with value ${note}`,
						),
					);
				},
			);
		}
	});

	test(`${NoteService.prototype.findById.name} method rejects invalid id parameter value`, async (t) => {
		for (const id of [undefined, null, {}, [], new Set(), "", " ", "a"]) {
			await t.test(
				`${typeof id} "${id}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							noteService.findById(id);
						},
						new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`),
					);
				},
			);
		}
	});

	test(`${NoteService.prototype.update.name} method rejects invalid note parameter value`, async (t) => {
		for (const note of [undefined, null, {}, [], new Set(), "", " ", "a"]) {
			await t.test(
				`${typeof note} "${note}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							noteService.update(note);
						},
						new TypeError(
							`note must be an instance of ${NoteForUpdate.name}, was type ${typeof note} with value ${note}`,
						),
					);
				},
			);
		}
	});

	test(`${NoteService.prototype.deleteById.name} method rejects invalid id parameter value`, async (t) => {
		for (const id of [undefined, null, {}, [], new Set(), "", " ", "a"]) {
			await t.test(
				`${typeof id} "${id}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							noteService.deleteById(id);
						},
						new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`),
					);
				},
			);
		}
	});
});
