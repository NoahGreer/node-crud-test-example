import BetterSqlite3 from "better-sqlite3";
import Database from "better-sqlite3";
import { parse as parseUuid, v4 as uuidv4 } from "uuid";
import { Note, NoteForCreate, NoteForUpdate, NoteListPage } from "../model/note.js";
import UuidV4 from "../model/uuidv4.js";
import DaoError from "./dao-error.js";

function dedent(str) {
	const lines = str.split("\n");

	const smallestIndent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)[0].length));

	return lines.map((line) => line.slice(smallestIndent)).join("\n");
}

export default class NoteDao {
	static MIN_PAGE_SIZE = 1;
	static MAX_PAGE_SIZE = 100;
	static DEFAULT_PAGE_SIZE = 20;

	/**
	 * @type {BetterSqlite3.Database}
	 */
	#databaseConnection;

	/**
	 * @param {BetterSqlite3.Database} databaseConnection the database connection to use for performing queries
	 */
	constructor(databaseConnection) {
		if (!(databaseConnection instanceof Database)) {
			throw new TypeError(
				`databaseConnection must be an instance of ${Database.name}, was type ${typeof databaseConnection} with value ${databaseConnection}`,
			);
		}

		this.#databaseConnection = databaseConnection;
	}

	static #mapRowToNote(row) {
		return new Note(
			new UuidV4(
				uuidv4({
					random: row.id,
				}),
			),
			row.content,
			new Date(row.creationDateTime),
			new Date(row.lastUpdatedDateTime),
		);
	}

	/**
	 * Create a note
	 * @param {NoteForCreate} note
	 * @return {UuidV4} the id of the new note
	 * @throws {DaoError} if an error occurred while creating the note
	 */
	create(note) {
		if (!(note instanceof NoteForCreate)) {
			throw new TypeError(
				`note must be an instance of ${NoteForCreate.name}, was type ${typeof note} with value ${note}`,
			);
		}

		const id = new UuidV4(uuidv4());

		try {
			const insertStatment = this.#databaseConnection.prepare(
				`INSERT INTO Note (
					id,
					content
				)
				VALUES
				(
					:id,
					:content
				)`,
			);

			insertStatment.run({ id: parseUuid(id.value), content: note.content });

			return id;
		} catch (err) {
			throw new DaoError(`Failed to insert new note ${note} due to a database error: ${err.message}`, {
				cause: err,
			});
		}
	}

	/**
	 * Find a note by id
	 * @param {UuidV4} id
	 * @return {?Note} the note matching the id or null if it does not exist
	 * @throws {DaoError} if an error occurred while querying for the note
	 */
	findById(id) {
		if (!(id instanceof UuidV4)) {
			throw new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`);
		}

		try {
			const selectStatement = this.#databaseConnection.prepare(
				`SELECT
					id,
					content,
					creationDateTime,
					lastUpdatedDateTime
				FROM
					Note
				WHERE
					id = :id`,
			);

			const row = selectStatement.get({ id: parseUuid(id.value) });
			if (!row) {
				return null;
			}

			return NoteDao.#mapRowToNote(row);
		} catch (err) {
			throw new DaoError(`Failed to query for note with id ${id} due to a database error: ${err.message}`, {
				cause: err,
			});
		}
	}

	/**
	 * Get paginated Note list
	 * @param {?number} pageSize
	 * @param {?UuidV4} afterId
	 * @return {NoteListPage} the Note list page
	 * @throws {DaoError} if an error occurred while querying for notes
	 */
	list(pageSize, afterId) {
		if (pageSize === undefined) {
			pageSize = NoteDao.DEFAULT_PAGE_SIZE;
		} else if (!Number.isInteger(pageSize)) {
			throw new TypeError(
				`if provided, pageSize must be an integer, was type ${typeof pageSize} with value ${pageSize}`,
			);
		} else if (pageSize < NoteDao.MIN_PAGE_SIZE || pageSize > NoteDao.MAX_PAGE_SIZE) {
			throw new RangeError(
				`if provided, pageSize must be >= ${NoteDao.MIN_PAGE_SIZE} and <= ${NoteDao.MAX_PAGE_SIZE}, was ${pageSize}`,
			);
		}

		if (afterId !== undefined && !(afterId instanceof UuidV4)) {
			throw new TypeError(
				`if provided, afterId must be an instance of ${UuidV4.name}, was type ${typeof afterId} with value ${afterId}`,
			);
		}

		const clauses = [];

		clauses.push(`
			SELECT
				id,
				content,
				creationDateTime,
				lastUpdatedDateTime
			FROM
				Note`);

		if (afterId) {
			clauses.push(`
				WHERE
					id > :afterId`);
		}

		clauses.push(`
			ORDER BY
				creationDateTime DESC, id ASC
			LIMIT
				:pageSize`);

		const query = clauses.map(dedent).join("\n");

		const params = {};

		if (afterId) {
			params.afterId = parseUuid(afterId.value);
		}

		params.pageSize = pageSize;

		try {
			const selectStatement = this.#databaseConnection.prepare(query);

			const notes = selectStatement.all(params).map(NoteDao.#mapRowToNote);

			return new NoteListPage(pageSize, notes);
		} catch (err) {
			throw new DaoError(`Failed to query for notes list page due to a database error: ${err.message}`, { cause: err });
		}
	}

	/**
	 * Find all notes
	 * @return {Note[]} the array of all notes
	 * @throws {DaoError} if an error occurred while querying for all notes
	 */
	findAll() {
		try {
			const selectStatement = this.#databaseConnection.prepare(
				`SELECT
					id,
					content,
					creationDateTime,
					lastUpdatedDateTime
				FROM
					Note`,
			);

			return selectStatement.all().map(NoteDao.#mapRowToNote);
		} catch (err) {
			throw new DaoError(`Failed to query for all notes due to a database error: ${err.message}`, { cause: err });
		}
	}

	/**
	 * Update a note
	 * @param {NoteForUpdate} note
	 * @throws {DaoError} if an error occurred while updating the note
	 */
	update(note) {
		if (!(note instanceof NoteForUpdate)) {
			throw new TypeError(
				`note must be an instance of ${NoteForUpdate.name}, was type ${typeof note} with value ${note}`,
			);
		}

		try {
			const updateStatement = this.#databaseConnection.prepare(
				`UPDATE
					Note
				SET
					content = :content
				WHERE
					id = :id`,
			);

			updateStatement.run({ content: note.content, id: parseUuid(note.id.value) });
		} catch (err) {
			throw new DaoError(`Failed to update note ${note} due to a database error: ${err.message}`, { cause: err });
		}
	}

	/**
	 * Delete a note by id
	 * @param {UuidV4} id
	 * @throws {DaoError} if an error occurred while deleting the note
	 */
	deleteById(id) {
		if (!(id instanceof UuidV4)) {
			throw new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`);
		}

		try {
			const deleteStatement = this.#databaseConnection.prepare(
				`DELETE FROM
					Note
				WHERE
					id = :id`,
			);

			deleteStatement.run({ id: parseUuid(id.value) });
		} catch (err) {
			throw new DaoError(`Failed to delete note with id ${id} due to a database error: ${err.message}`, {
				cause: err,
			});
		}
	}
}
