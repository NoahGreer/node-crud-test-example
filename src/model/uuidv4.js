import { validate as validateUuid, version as uuidVersion } from "uuid";

export default class UuidV4 {
	/**
	 * @type {string}
	 */
	#value;

	/**
	 * @param {string} value the UUIDv4 string
	 */
	constructor(value) {
		if (!validateUuid(value) || uuidVersion(value) !== 4) {
			throw new TypeError(`value must be a valid UUIDv4 string, was type ${typeof value} with value ${value}`);
		}

		this.#value = value;
	}

	/**
	 * @return {string} the UUIDv4 string value
	 */
	get value() {
		return this.#value;
	}

	toJSON() {
		return this.#value;
	}

	toString() {
		return `${UuidV4.name} ${JSON.stringify(this.toJSON())}`;
	}
}
