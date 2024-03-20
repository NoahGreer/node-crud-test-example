/*
Reference:
Optimizing SQLite for servers
https://kerkour.com/sqlite-for-servers

PRAGMA Statements
https://www.sqlite.org/pragma.html
*/
PRAGMA encoding = 'UTF-8';
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA temp_store = memory;
/*
Cache size set to a negative number to indicate a size in kibibytes
SQLite will calculate the proportional number of cache pages for the given number
Denoting this value in kibibytes feels more intuitive than using the number of pages
Reference:
https://www.sqlite.org/pragma.html#pragma_cache_size
*/
PRAGMA busy_timeout = -100000; -- ~102.4 MB

/*
Use write-ahead log
References:
https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md
https://www.sqlite.org/pragma.html#pragma_journal_mode
https://www.sqlite.org/wal.html
*/
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS Note (
	id BLOB PRIMARY KEY,
	content TEXT NOT NULL,
	creationDateTime INT NOT NULL DEFAULT (CAST((unixepoch('subsec') * 1000) AS INTEGER)),
	lastUpdatedDateTime INT NOT NULL DEFAULT (CAST((unixepoch('subsec') * 1000) AS INTEGER))
) WITHOUT ROWID, STRICT;
CREATE INDEX IF NOT EXISTS idx_Note_creationDateTime ON Note (creationDateTime);

CREATE TRIGGER IF NOT EXISTS tr_Note_update_lastUpdatedDateTime_au AFTER UPDATE ON Note
BEGIN
 	UPDATE Note SET lastUpdatedDateTime = CAST((unixepoch('subsec') * 1000) AS INTEGER) WHERE id = new.id;
END;
