import { isDate, isString } from "../util/validation.js";
import UuidV4 from "./uuidv4.js";

export class NoteForCreate {
	#content;

	/**
	 * @param {string} content the content of the note
	 */
	constructor(content) {
		if (!isString(content)) {
			throw new TypeError(`content must be a string, was type ${typeof content} with value ${content}`);
		}

		this.#content = content;
	}

	/**
	 * @return {string} the content of the note
	 */
	get content() {
		return this.#content;
	}

	toJSON() {
		return { content: this.#content };
	}

	toString() {
		return `${NoteForCreate.name} ${JSON.stringify(this.toJSON())}`;
	}
}

export class NoteForUpdate extends NoteForCreate {
	#id;

	/**
	 * @param {UuidV4} id the id of the note
	 * @param {string} content the content of the note
	 */
	constructor(id, content) {
		if (!(id instanceof UuidV4)) {
			throw new TypeError(`id must be an instance of ${UuidV4.name}, was type ${typeof id} with value ${id}`);
		}

		super(content);

		this.#id = id;
	}

	/**
	 * @return {UuidV4} the UUIDv4 id of the note
	 */
	get id() {
		return this.#id;
	}

	toJSON() {
		return { id: this.#id, ...super.toJSON() };
	}

	toString() {
		return `${NoteForUpdate.name} ${JSON.stringify(this.toJSON())}`;
	}
}

export class Note extends NoteForUpdate {
	#creationDateTime;
	#lastUpdatedDateTime;

	/**
	 * @param {UuidV4} id the UUIDv4 id of the note
	 * @param {string} content the content of the note
	 * @param {Date} creationDateTime the creation date and time of the note
	 * @param {Date} lastUpdatedDateTime the last update date and time of the note
	 */
	constructor(id, content, creationDateTime, lastUpdatedDateTime) {
		super(id, content);

		if (!isDate(creationDateTime)) {
			throw new TypeError(`creationDateTime must be a Date object, was ${typeof creationDateTime} ${creationDateTime}`);
		}

		if (!isDate(lastUpdatedDateTime)) {
			throw new TypeError(
				`lastUpdatedDateTime must be a Date object, was ${typeof lastUpdatedDateTime} ${lastUpdatedDateTime}`,
			);
		}

		this.#creationDateTime = creationDateTime;
		this.#lastUpdatedDateTime = lastUpdatedDateTime;
	}

	/**
	 * @return {Date} the creation date and time of the note
	 */
	get creationDateTime() {
		return new Date(this.#creationDateTime);
	}

	/**
	 * @return {Date} the last updated date and time of the note
	 */
	get lastUpdatedDateTime() {
		return new Date(this.#lastUpdatedDateTime);
	}

	toJSON() {
		return {
			...super.toJSON(),
			creationDateTime: this.#creationDateTime,
			lastUpdatedDateTime: this.#lastUpdatedDateTime,
		};
	}

	toString() {
		return `${Note.name} ${JSON.stringify(this.toJSON())}`;
	}
}

export class NoteListPage {
	/**
	 * @type {number} the size of the page
	 */
	#pageSize;

	/**
	 * @type {Note[]} the list of notes in the page
	 */
	#notes;

	constructor(pageSize, notes) {
		if (!Number.isInteger(pageSize)) {
			throw new TypeError(`pageSize must be an integer, was type ${typeof pageSize} with value ${pageSize}`);
		}

		if (!Array.isArray(notes)) {
			throw new TypeError(`notes must be an instance of ${Array.name}, was type ${typeof notes} with value ${notes}`);
		}

		const notesCopy = [];
		for (let i = 0; i < notes.length; i++) {
			const note = notes[i];

			if (!(note instanceof Note)) {
				throw new TypeError(
					`each element in the notes list must be an instance of ${Note.name}, element ${i} was type ${typeof note} with value ${note}`,
				);
			}

			notesCopy.push(note);
		}

		this.#pageSize = pageSize;
		this.#notes = notesCopy;
	}

	/**
	 * @type {number} the size of the page
	 */
	get pageSize() {
		return this.#pageSize;
	}

	/**
	 * @type {Note[]} the list of notes in the page
	 */
	get notes() {
		return Array.from(this.#notes);
	}

	toJSON() {
		return {
			pageSize: this.#pageSize,
			notes: this.#notes,
		};
	}

	toString() {
		return `${NoteListPage.name} ${JSON.stringify(this.toJSON())}`;
	}
}
