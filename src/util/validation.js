export function isDate(value) {
	return value instanceof Date;
}

export function isString(value) {
	return typeof value === "string" || value instanceof String;
}
