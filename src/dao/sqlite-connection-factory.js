import { fileURLToPath } from "url";
import BetterSqlite3 from "better-sqlite3";
import Database from "better-sqlite3";
import fs from "node:fs";
import path, { dirname } from "path";
import { isString } from "../util/validation.js";
import DaoError from "./dao-error.js";

export default class SqliteConnectionFactory {
	static #loadCreateSchemaSqlScript() {
		const filename = fileURLToPath(import.meta.url);
		const dir = dirname(filename);
		return fs.readFileSync(path.resolve(dir, "./migrations/000_db_schema_create.sql"), "utf8");
	}

	/**
	 * Creates a connection to the database
	 * @param {string} databaseFilename the path to the database file
	 * @returns {BetterSqlite3.Database} the database connection
	 */
	static createConnection(databaseFilename) {
		if (!isString(databaseFilename)) {
			throw new TypeError(
				`databaseFilename must be a string, was type ${typeof databaseFilename} with value ${databaseFilename}`,
			);
		}

		let db;
		try {
			db = new Database(databaseFilename);
		} catch (err) {
			throw new DaoError(`Failed to create connection to SQLite database ${databaseFilename}`, { cause: err });
		}

		try {
			db.exec(SqliteConnectionFactory.#loadCreateSchemaSqlScript());
		} catch (err) {
			throw new DaoError(
				`Failed to execute schema create script for connection to SQLite database ${databaseFilename}: ${err.message}`,
				{
					cause: err,
				},
			);
		}

		return db;
	}
}
