import { after, afterEach, before, describe, test } from "node:test";
import { deepStrictEqual, ok, strictEqual } from "node:assert";
import * as http from "http";
import { v4 as uuidv4 } from "uuid";
import SqliteConnectionFactory from "../../src/dao/sqlite-connection-factory.js";
import NoteDao from "../../src/dao/note-dao.js";
import NoteService from "../../src/service/note-service.js";
import Server from "../../src/api/server.js";
import { StatusCodes } from "http-status-codes";
import { NoteForCreate } from "../../src/model/note.js";
import UuidV4 from "../../src/model/uuidv4.js";
import logger from "../../src/util/logger.js";

class HeaderFieldNames {
	static ACCEPT = "Accept";
	static ACCEPT_ENCODING = "Accept-Encoding";
	static CONTENT_TYPE = "Content-Type";
	static CONTENT_ENCODING = "Content-Encoding";
}

class ContentTypes {
	static APPLICATION_JSON = "application/json";
	static APPLICATION_JSON_UTF8 = "application/json; charset=utf-8";
	static TEXT_PLAIN_UTF8 = "text/plain; charset=utf-8";
}

class EncodingTypes {
	static GZIP = "gzip";
	static DEFLATE = "deflate";
	static BROTLI = "br";
}

function buildNoteForCreateArray(count) {
	const noteForCreateArray = [];
	for (let i = 0; i < count; i++) {
		noteForCreateArray.push(new NoteForCreate("testNoteContent" + i));
	}

	return noteForCreateArray;
}

describe("Server HTTP API", () => {
	const port = 3001;
	const baseUrl = `http://localhost:${port}/api/v1`;

	/**
	 * @type {NoteService}
	 */
	let noteService;

	/**
	 * @type {http.Server}
	 */
	let server;

	before(() => {
		const databaseConnection = SqliteConnectionFactory.createConnection(":memory:");
		const noteDao = new NoteDao(databaseConnection);

		noteService = new NoteService(databaseConnection, noteDao);
		server = new Server(noteService).buildApp().listen(port);
	});

	after(() => {
		server.close();
	});

	afterEach(() => {
		noteService.findAll().forEach((note) => noteService.deleteById(note.id));
	});

	describe("root /api/v1", () => {
		test("GET to / path returns alive response", async () => {
			const response = await fetch(`${baseUrl}/`, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
			});

			strictEqual(response.status, StatusCodes.OK);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), ContentTypes.APPLICATION_JSON_UTF8);

			const body = await response.json();

			deepStrictEqual(body, { message: "alive" });
		});
	});

	describe("NoteRoutes /api/v1/notes", () => {
		test("GET /notes returns empty list when no notes exist", async () => {
			const response = await fetch(`${baseUrl}/notes`, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
			});

			strictEqual(response.status, StatusCodes.OK);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), ContentTypes.APPLICATION_JSON_UTF8);

			const body = await response.json();

			deepStrictEqual(body.notes, []);
		});

		test("GET /notes returns list with one note when one note exists", async () => {
			const expectedNoteId = noteService.create(new NoteForCreate("testContent"));
			const expectedNote = noteService.findById(expectedNoteId);

			const response = await fetch(`${baseUrl}/notes`, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
			});

			strictEqual(response.status, StatusCodes.OK);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), ContentTypes.APPLICATION_JSON_UTF8);

			const body = await response.json();

			deepStrictEqual(body.notes, [
				{
					content: expectedNote.content,
					creationDateTime: expectedNote.creationDateTime.toISOString(),
					id: expectedNote.id.value,
					lastUpdatedDateTime: expectedNote.lastUpdatedDateTime.toISOString(),
				},
			]);
		});

		test("GET /notes?pageSize=10 returns list with first page of notes when more than page size notes exist", async () => {
			const pageSize = 10;

			buildNoteForCreateArray(pageSize + 1).forEach((noteForCreate) => noteService.create(noteForCreate));

			const expectedNotes = noteService.list(pageSize).notes.map((note) => {
				return {
					id: note.id.value,
					content: note.content,
					creationDateTime: note.creationDateTime.toISOString(),
					lastUpdatedDateTime: note.lastUpdatedDateTime.toISOString(),
				};
			});

			const url = new URL(`${baseUrl}/notes`);
			url.searchParams.append("pageSize", pageSize);

			const response = await fetch(url, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
			});

			strictEqual(response.status, StatusCodes.OK);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), ContentTypes.APPLICATION_JSON_UTF8);

			const body = await response.json();

			deepStrictEqual(body.notes, expectedNotes);
		});

		test("GET /notes?pageSize=10&afterId={id} returns list with next page of notes when more than page size notes exist", async () => {
			const pageSize = 10;

			buildNoteForCreateArray(pageSize + 1).forEach((noteForCreate) => noteService.create(noteForCreate));

			const expectedFirstPageNotes = noteService.list(pageSize).notes.map((note) => {
				return {
					id: note.id.value,
					content: note.content,
					creationDateTime: note.creationDateTime.toISOString(),
					lastUpdatedDateTime: note.lastUpdatedDateTime.toISOString(),
				};
			});

			const firstPageUrl = new URL(`${baseUrl}/notes`);
			firstPageUrl.searchParams.append("pageSize", pageSize);

			const firstPageResponse = await fetch(firstPageUrl, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
			});

			strictEqual(firstPageResponse.status, StatusCodes.OK);
			strictEqual(firstPageResponse.headers.get(HeaderFieldNames.CONTENT_TYPE), ContentTypes.APPLICATION_JSON_UTF8);

			const firstPageBody = await firstPageResponse.json();

			deepStrictEqual(firstPageBody.notes, expectedFirstPageNotes);

			const afterId = firstPageBody.notes[firstPageBody.notes.length - 1].id;

			const expectedSecondPageNotes = noteService.list(pageSize, new UuidV4(afterId)).notes.map((note) => {
				return {
					id: note.id.value,
					content: note.content,
					creationDateTime: note.creationDateTime.toISOString(),
					lastUpdatedDateTime: note.lastUpdatedDateTime.toISOString(),
				};
			});

			const secondPageUrl = new URL(`${baseUrl}/notes`);
			secondPageUrl.searchParams.append("pageSize", pageSize);
			secondPageUrl.searchParams.append("afterId", afterId);
			console.log(`secondPageUrl: ${secondPageUrl}`);

			const secondPageResponse = await fetch(secondPageUrl, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
			});

			const secondPageBody = await secondPageResponse.json();
			console.log(secondPageBody);

			strictEqual(secondPageResponse.status, StatusCodes.OK);
			strictEqual(secondPageResponse.headers.get(HeaderFieldNames.CONTENT_TYPE), ContentTypes.APPLICATION_JSON_UTF8);

			deepStrictEqual(secondPageBody.notes, expectedSecondPageNotes);
		});

		test("GET /notes/:id returns 404 status when no corresponding note exists", async () => {
			const id = uuidv4();

			const response = await fetch(`${baseUrl}/notes/${id}`, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
			});

			strictEqual(response.status, StatusCodes.NOT_FOUND);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), null);

			const body = await response.text();

			deepStrictEqual(body, "");
		});

		test("GET /notes/:id returns note when corresponding note exists", async () => {
			const expectedNoteId = noteService.create(new NoteForCreate("testContent"));
			const expectedNote = noteService.findById(expectedNoteId);

			const response = await fetch(`${baseUrl}/notes/${expectedNoteId.value}`, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
			});

			strictEqual(response.status, StatusCodes.OK);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), ContentTypes.APPLICATION_JSON_UTF8);

			const body = await response.json();

			deepStrictEqual(body, {
				id: expectedNote.id.value,
				content: expectedNote.content,
				creationDateTime: expectedNote.creationDateTime.toISOString(),
				lastUpdatedDateTime: expectedNote.lastUpdatedDateTime.toISOString(),
			});
		});

		test("POST /notes creates note", async () => {
			const note = { content: "testContent" };

			const response = await fetch(`${baseUrl}/notes`, {
				body: JSON.stringify(note),
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
					[HeaderFieldNames.CONTENT_TYPE]: ContentTypes.APPLICATION_JSON,
				},
				method: "POST",
			});

			strictEqual(response.status, StatusCodes.CREATED);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), ContentTypes.APPLICATION_JSON_UTF8);

			const body = await response.json();

			ok(new UuidV4(body.id));
		});

		test("PUT /notes/:id returns 404 status when no corresponding note exists", async () => {
			try {
				const id = uuidv4();

				const response = await fetch(`${baseUrl}/notes/${id}`, {
					headers: {
						[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
						[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
						[HeaderFieldNames.CONTENT_TYPE]: ContentTypes.APPLICATION_JSON,
					},
					body: JSON.stringify({ id: id, content: "testContent" }),
					method: "PUT",
				});

				strictEqual(response.status, StatusCodes.NOT_FOUND);
				strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), null);

				const body = await response.text();

				deepStrictEqual(body, "");
			} catch (err) {
				logger.error("failed to PUT note", err);
			}
		});

		test("PUT /notes/:id updates existing note", async () => {
			const id = noteService.create(new NoteForCreate("testContent"));
			const note = { id: id, content: "testContent" };

			const response = await fetch(`${baseUrl}/notes/${id.value}`, {
				body: JSON.stringify(note),
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
					[HeaderFieldNames.CONTENT_TYPE]: ContentTypes.APPLICATION_JSON,
				},
				method: "PUT",
			});

			strictEqual(response.status, StatusCodes.NO_CONTENT);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), null);
		});

		test("DELETE /notes/:id returns 404 status when no corresponding note exists", async () => {
			const id = uuidv4();

			const response = await fetch(`${baseUrl}/notes/${id}`, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
				method: "DELETE",
			});

			strictEqual(response.status, StatusCodes.NOT_FOUND);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), null);

			const body = await response.text();

			deepStrictEqual(body, "");
		});

		test("DELETE /notes/:id deletes existing note", async () => {
			const id = noteService.create(new NoteForCreate("testContent"));

			const response = await fetch(`${baseUrl}/notes/${id.value}`, {
				headers: {
					[HeaderFieldNames.ACCEPT]: ContentTypes.APPLICATION_JSON,
					[HeaderFieldNames.ACCEPT_ENCODING]: EncodingTypes.GZIP,
				},
				method: "DELETE",
			});

			strictEqual(response.status, StatusCodes.NO_CONTENT);
			strictEqual(response.headers.get(HeaderFieldNames.CONTENT_TYPE), null);

			const body = await response.text();

			deepStrictEqual(body, "");
		});
	});
});
