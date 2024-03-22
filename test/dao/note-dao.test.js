import { beforeEach, describe, test } from "node:test";
import { deepStrictEqual, strictEqual, notStrictEqual, ok, throws } from "node:assert";
import Database from "better-sqlite3";
import SqliteDbConnectionFactory from "../../src/dao/sqlite-connection-factory.js";
import NoteDao from "../../src/dao/note-dao.js";
import { NoteForCreate, NoteForUpdate, Note } from "../../src/model/note.js";
import UuidV4 from "../../src/model/uuidv4.js";

function buildNoteForCreateArray(count) {
	const noteForCreateArray = [];
	for (let i = 0; i < count; i++) {
		noteForCreateArray.push(new NoteForCreate("testNoteContent" + i));
	}

	return noteForCreateArray;
}

describe(`${NoteDao.constructor.name}`, () => {
	/**
	 * @type {BetterSqlite3.Database}
	 */
	let databaseConnection;
	/**
	 * @type {NoteDao}
	 */
	let noteDao;

	beforeEach(() => {
		databaseConnection = SqliteDbConnectionFactory.createConnection(":memory:");

		noteDao = new NoteDao(databaseConnection);
	});

	test("constructor rejects invalid databaseConnection parameter", async (t) => {
		for (const databaseConnection of [undefined, null, 0, {}, [], new Set()]) {
			await t.test(
				`${typeof databaseConnection} "${databaseConnection}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							new NoteDao(databaseConnection);
						},
						new TypeError(
							`databaseConnection must be an instance of ${Database.name}, was type ${typeof databaseConnection} with value ${databaseConnection}`,
						),
					);
				},
			);
		}
	});

	test(`${NoteDao.prototype.create.name} method rejects invalid note parameter`, async (t) => {
		for (const note of [undefined, null, 0, {}, [], new Set()]) {
			await t.test(
				`note ${typeof note} "${note}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							noteDao.create(note);
						},
						new TypeError(
							`note must be an instance of ${NoteForCreate.name}, was type ${typeof note} with value ${note}`,
						),
					);
				},
			);
		}
	});

	test(`${NoteDao.prototype.findById.name} method rejects invalid id parameter`, async (t) => {
		for (const id of [undefined, null, 0, {}, [], new Set()]) {
			await t.test(
				`note ${typeof id} "${id}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							noteDao.findById(id);
						},
						new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`),
					);
				},
			);
		}
	});

	test(`${NoteDao.prototype.update.name} method rejects invalid note parameter`, async (t) => {
		for (const note of [undefined, null, 0, {}, [], new Set()]) {
			await t.test(
				`note ${typeof note} "${note}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							noteDao.update(note);
						},
						new TypeError(
							`note must be an instance of ${NoteForUpdate.name}, was type ${typeof note} with value ${note}`,
						),
					);
				},
			);
		}
	});

	test(`${NoteDao.prototype.deleteById.name} method rejects invalid id parameter`, async (t) => {
		for (const id of [undefined, null, 0, {}, [], new Set()]) {
			await t.test(
				`note ${typeof id} "${id}" expecting to throw ${TypeError.name} with descriptive validation message`,
				() => {
					throws(
						() => {
							noteDao.deleteById(id);
						},
						new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`),
					);
				},
			);
		}
	});

	test("crud single note", () => {
		// Create a note
		const noteForCreate = new NoteForCreate("testNoteContent");

		const noteId = noteDao.create(noteForCreate);
		const afterCreated = new Date();

		ok(noteId instanceof UuidV4);

		// Check created note can be retrieved by id
		const foundNote = noteDao.findById(noteId);

		ok(foundNote instanceof Note);
		deepStrictEqual(foundNote.id, noteId);
		strictEqual(foundNote.content, noteForCreate.content);
		ok(foundNote.creationDateTime.getTime() <= afterCreated.getTime());
		ok(foundNote.lastUpdatedDateTime.getTime() <= afterCreated.getTime());

		// Check that findAll finds created note
		const allNotes = noteDao.findAll();
		strictEqual(allNotes.length, 1);
		deepStrictEqual(allNotes[0], foundNote);

		// Update created note
		const noteForUpdate = new NoteForUpdate(noteId, "testNoteContentUpdated");
		noteDao.update(noteForUpdate);

		// Check that note can be updated correctly
		const updatedNote = noteDao.findById(noteId);
		ok(updatedNote instanceof Note);
		deepStrictEqual(updatedNote.id, noteId);
		notStrictEqual(updatedNote.content, noteForCreate.content);
		strictEqual(updatedNote.content, noteForUpdate.content);
		ok(updatedNote.creationDateTime.getTime() === foundNote.creationDateTime.getTime());
		ok(updatedNote.lastUpdatedDateTime.getTime() >= foundNote.lastUpdatedDateTime.getTime());

		noteDao.deleteById(noteId);

		const foundDeletedNote = noteDao.findById(noteId);
		strictEqual(foundDeletedNote, null);

		const allNotesAfterDelete = noteDao.findAll();
		strictEqual(allNotesAfterDelete.length, 0);
	});

	test("crud multiple notes", () => {
		// Create multiple notes
		const noteForCreateArray = buildNoteForCreateArray(3);

		const noteIds = noteForCreateArray.map((noteForCreate) => noteDao.create(noteForCreate));

		// Check that created notes can be retrieved by id
		const foundNotes = noteIds.map((noteId) => noteDao.findById(noteId));

		for (let i = 0; i < noteForCreateArray.length; i++) {
			const foundNote = foundNotes[i];
			const noteId = noteIds[i];
			const noteForCreate = noteForCreateArray[i];

			deepStrictEqual(foundNote.id, noteId);
			strictEqual(foundNote.content, noteForCreate.content);
		}

		// Check that findAll finds all created notes
		const allNotes = noteDao.findAll();
		deepStrictEqual(allNotes, foundNotes);

		// Check that notes can be updated correctly
		const noteForUpdateArray = foundNotes.map(
			(foundNote) => new NoteForUpdate(foundNote.id, foundNote.content + "Updated"),
		);

		noteForUpdateArray.forEach((noteForUpdate) => noteDao.update(noteForUpdate));

		const updatedNotes = noteForUpdateArray.map((noteForUpdate) => noteDao.findById(noteForUpdate.id));

		for (let i = 0; i < noteForCreateArray.length; i++) {
			const updatedNote = updatedNotes[i];
			const foundNote = foundNotes[i];
			const noteForCreate = noteForCreateArray[i];
			const noteForUpdate = noteForUpdateArray[i];

			deepStrictEqual(updatedNote.id, foundNote.id);
			notStrictEqual(updatedNote.content, noteForCreate.content);
			strictEqual(updatedNote.content, noteForUpdate.content);
		}

		// Delete only middle note
		const middleNoteId = noteIds[1];
		noteDao.deleteById(middleNoteId);
		const foundDeletedMiddleNote = noteDao.findById(middleNoteId);
		strictEqual(foundDeletedMiddleNote, null);

		// Check that surrounding notes still exist
		const allNotesAfterMiddleDeleted = noteDao.findAll();
		strictEqual(allNotesAfterMiddleDeleted.length, 2);
		deepStrictEqual(allNotesAfterMiddleDeleted[0].id, foundNotes[0].id);
		deepStrictEqual(allNotesAfterMiddleDeleted[1].id, foundNotes[2].id);

		// Delete remaining notes
		noteIds.forEach((noteId) => noteDao.deleteById(noteId));

		const foundDeletedNotes = noteIds.map((noteId) => noteDao.findById(noteId)).filter((note) => note instanceof Note);
		strictEqual(foundDeletedNotes.length, 0);

		const allNotesAfterAllDeleted = noteDao.findAll();
		strictEqual(allNotesAfterAllDeleted.length, 0);
	});

	describe(`${NoteDao.prototype.list.name} method`, () => {
		test("no parameters when results smaller than default page size", () => {
			const pageSize = NoteDao.DEFAULT_PAGE_SIZE;

			// Create multiple notes
			const noteForCreateArray = buildNoteForCreateArray(pageSize - 1);

			noteForCreateArray.forEach((noteForCreate) => noteDao.create(noteForCreate));

			// Check that list finds all created notes
			const listNotesPage = noteDao.list();

			for (let i = 0; i < noteForCreateArray.length; i++) {
				const noteForCreate = noteForCreateArray[noteForCreateArray.length - 1 - i];
				const note = listNotesPage.notes[i];

				strictEqual(noteForCreate.content, note.content);
			}
		});

		test("no parameters when results greater than page size", () => {
			const pageSize = NoteDao.DEFAULT_PAGE_SIZE;

			// Create multiple notes
			const noteForCreateArray = buildNoteForCreateArray(pageSize + 1);

			noteForCreateArray.forEach((noteForCreate) => noteDao.create(noteForCreate));

			// Check that list finds all created notes in page
			const listNotesPage = noteDao.list();
			strictEqual(pageSize, listNotesPage.notes.length);

			for (let i = 0; i < pageSize; i++) {
				const noteForCreate = noteForCreateArray[noteForCreateArray.length - 1 - i];
				const note = listNotesPage.notes[i];

				strictEqual(noteForCreate.content, note.content);
			}
		});

		test("pageSize parameter when results less than page size", () => {
			const pageSize = 10;

			// Create multiple notes
			const noteForCreateArray = buildNoteForCreateArray(pageSize - 1);

			noteForCreateArray.forEach((noteForCreate) => noteDao.create(noteForCreate));

			// Check that list finds all created notes in page
			const listNotesPage = noteDao.list(pageSize);
			strictEqual(noteForCreateArray.length, listNotesPage.notes.length);

			for (let i = 0; i < noteForCreateArray.length; i++) {
				const noteForCreate = noteForCreateArray[noteForCreateArray.length - 1 - i];
				const note = listNotesPage.notes[i];

				strictEqual(noteForCreate.content, note.content);
			}
		});

		test("pageSize parameter when results greater than page size", () => {
			const pageSize = 10;

			// Create multiple notes
			const noteForCreateArray = buildNoteForCreateArray(pageSize + 1);

			noteForCreateArray.forEach((noteForCreate) => noteDao.create(noteForCreate));

			// Check that list finds all created notes in page
			const listNotesPage = noteDao.list(pageSize);
			strictEqual(pageSize, listNotesPage.notes.length);

			for (let i = 0; i < pageSize; i++) {
				const noteForCreate = noteForCreateArray[noteForCreateArray.length - 1 - i];
				const note = listNotesPage.notes[i];

				strictEqual(noteForCreate.content, note.content);
			}
		});

		test("pageSize and afterId parameter when results less than page size", () => {
			const pageSize = 10;

			// Create multiple notes
			const noteForCreateArray = buildNoteForCreateArray(pageSize - 1);

			noteForCreateArray.forEach((noteForCreate) => noteDao.create(noteForCreate));

			// Check that list finds all created notes in page
			const firstListNotesPage = noteDao.list(pageSize);
			strictEqual(noteForCreateArray.length, firstListNotesPage.notes.length);

			for (let i = 0; i < firstListNotesPage.length; i++) {
				const noteForCreate = noteForCreateArray[noteForCreateArray.length - 1 - i];
				const note = firstListNotesPage.notes[i];

				strictEqual(noteForCreate.content, note.content);
			}

			const afterId = firstListNotesPage.notes[firstListNotesPage.notes.length - 1].id;

			const secondListNotesPage = noteDao.list(pageSize, afterId);
			strictEqual(0, secondListNotesPage.notes.length);
		});

		test("pageSize and afterId parameter when results greater than page size", () => {
			const pageSize = 10;

			// Create multiple notes
			const noteForCreateArray = buildNoteForCreateArray(pageSize + 1);

			noteForCreateArray.forEach((noteForCreate) => noteDao.create(noteForCreate));

			// Check that list finds all created notes in page
			const firstListNotesPage = noteDao.list(pageSize);
			strictEqual(pageSize, firstListNotesPage.notes.length);

			for (let i = 0; i < firstListNotesPage.notes.length; i++) {
				const noteForCreate = noteForCreateArray[noteForCreateArray.length - 1 - i];
				const note = firstListNotesPage.notes[i];

				strictEqual(noteForCreate.content, note.content);
			}

			const afterId = firstListNotesPage.notes[firstListNotesPage.notes.length - 1].id;
			const secondListNotesPage = noteDao.list(pageSize, afterId);
			strictEqual(noteForCreateArray.length - pageSize, secondListNotesPage.notes.length);

			for (let i = 0; i < secondListNotesPage.notes.length; i++) {
				const noteForCreate = noteForCreateArray[noteForCreateArray.length - 1 - pageSize - i];
				const note = secondListNotesPage.notes[i];

				strictEqual(noteForCreate.content, note.content);
			}
		});
	});
});
