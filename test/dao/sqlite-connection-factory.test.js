import { before, describe, test } from "node:test";
import { ok, throws } from "node:assert";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

import Database from "better-sqlite3";
import SqliteConnectionFactory from "../../src/dao/sqlite-connection-factory.js";

describe(`${SqliteConnectionFactory.name}`, () => {
	/**
	 * @type {string}
	 */
	let notesDbFilepath;

	before(() => {
		notesDbFilepath = path.resolve(os.tmpdir(), "notes.db");

		// ensure temp db file does not exist
		if (fs.existsSync(notesDbFilepath)) {
			fs.rmSync(notesDbFilepath);
		}
	});

	describe(`${SqliteConnectionFactory.createConnection.name} method`, () => {
		test(`rejects invalid databaseFilename parameter`, async (t) => {
			for (const databaseFilename of [undefined, null, 0, {}, [], new Set()]) {
				await t.test(
					`${typeof databaseFilename} "${databaseFilename}" expecting to throw error with descriptive validation message`,
					() => {
						throws(
							() => {
								SqliteConnectionFactory.createConnection(databaseFilename);
							},
							new TypeError(
								`databaseFilename must be a string, was type ${typeof databaseFilename} with value ${databaseFilename}`,
							),
						);
					},
				);
			}
		});

		test(`accepts reserved ":memory:" database filename`, () => {
			const db = SqliteConnectionFactory.createConnection(":memory:");
			ok(db instanceof Database);
		});

		test(`accepts database filename`, () => {
			const db = SqliteConnectionFactory.createConnection(notesDbFilepath);
			ok(db instanceof Database);

			ok(fs.existsSync(notesDbFilepath));
		});
	});
});
