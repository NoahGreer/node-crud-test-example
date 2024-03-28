import BetterSqlite3 from "better-sqlite3";
import Database from "better-sqlite3";
import { NoteForCreate, NoteForUpdate, Note } from "../model/note.js";
import UuidV4 from "../model/uuidv4.js";
import { ServiceError, EntityNotFoundError } from "./service-error.js";
import NoteDao from "../dao/note-dao.js";

export default class NoteService {
	/**
	 * @type {BetterSqlite3.Database}
	 */
	#databaseConnection;

	/**
	 * @type {NoteDao}
	 */
	#noteDao;

	/**
	 * @param {BetterSqlite3.Database} databaseConnection the database connection for the service to use
	 * @param {NoteDao} noteDao the noteDao to use for Note CRUD operations (needs to use the same database connection)
	 */
	constructor(databaseConnection, noteDao) {
		if (!(databaseConnection instanceof Database)) {
			throw new TypeError(
				`databaseConnection must be an instance of ${Database.name}, was type ${typeof databaseConnection} with value ${databaseConnection}`,
			);
		}

		if (!(noteDao instanceof NoteDao)) {
			throw new TypeError(
				`noteDao must be an instance of ${NoteDao.name}, was type ${typeof noteDao} with value ${noteDao}`,
			);
		}

		this.#databaseConnection = databaseConnection;
		this.#noteDao = noteDao;
	}

	/**
	 * Create a note
	 * @param {NoteForCreate} note
	 * @return {UuidV4} the id of the new note
	 */
	create(note) {
		if (!(note instanceof NoteForCreate)) {
			throw new TypeError(
				`note must be an instance of ${NoteForCreate.name}, was type ${typeof note} with value ${note}`,
			);
		}

		try {
			return this.#noteDao.create(note);
		} catch (err) {
			throw new ServiceError(`Failed to create note ${note}`, { cause: err });
		}
	}

	/**
	 * Find a note by id
	 * @param {UuidV4} id
	 * @return {?Note} the note matching the id or null if it does not exist
	 */
	findById(id) {
		if (!(id instanceof UuidV4)) {
			throw new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`);
		}

		try {
			return this.#noteDao.findById(id);
		} catch (err) {
			throw new ServiceError(`Failed while finding note by id ${id}`, { cause: err });
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

		try {
			return this.#noteDao.list(pageSize, afterId);
		} catch (err) {
			throw new ServiceError("Failed while finding all notes", { cause: err });
		}
	}

	/**
	 * Find all notes
	 * @return {Note[]} the array of all notes
	 */
	findAll() {
		try {
			return this.#noteDao.findAll();
		} catch (err) {
			throw new ServiceError("Failed while finding all notes", { cause: err });
		}
	}

	/**
	 * Update a note
	 * @param {NoteForUpdate} note
	 */
	update(note) {
		if (!(note instanceof NoteForUpdate)) {
			throw new TypeError(
				`note must be an instance of ${NoteForUpdate.name}, was type ${typeof note} with value ${note}`,
			);
		}

		const updateIfExists = this.#databaseConnection.transaction((note) => {
			let existingNote;
			try {
				existingNote = this.#noteDao.findById(note.id);
			} catch (err) {
				throw new ServiceError(`Failed while checking for existing note by id ${note.id.value}`, {
					cause: err,
				});
			}

			if (!existingNote) {
				throw new EntityNotFoundError(`No ${Note.name} with id ${note.id.value} exists`);
			}

			try {
				return this.#noteDao.update(note);
			} catch (err) {
				throw new ServiceError(`Failed while updating note ${note}`, { cause: err });
			}
		});

		updateIfExists.immediate(note);
	}

	/**
	 * Delete a note by id
	 * @param {UuidV4} id
	 */
	deleteById(id) {
		if (!(id instanceof UuidV4)) {
			throw new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`);
		}

		const deleteIfExists = this.#databaseConnection.transaction((id) => {
			let existingNote;
			try {
				existingNote = this.#noteDao.findById(id);
			} catch (err) {
				throw new ServiceError(`Failed while checking for existing note by id ${id.value}`, { cause: err });
			}

			if (!existingNote) {
				throw new EntityNotFoundError(`No ${Note.name} with id ${id.value} exists`);
			}

			try {
				return this.#noteDao.deleteById(id);
			} catch (err) {
				throw new ServiceError(`Failed while deleting note by id ${id}`, { cause: err });
			}
		});

		deleteIfExists.immediate(id);
	}
}
