import NoteDao from "./dao/note-dao.js";
import NoteService from "./service/note-service.js";
import Server from "./api/server.js";
import SqliteConnectionFactory from "./dao/sqlite-connection-factory.js";
import logger from "./util/logger.js";

const port = 3000 || process.env.PORT;

const databaseConnection = SqliteConnectionFactory.createConnection("./notes.db");
const noteDao = new NoteDao(databaseConnection);
const noteService = new NoteService(databaseConnection, noteDao);

const app = new Server(noteService).buildApp();

const server = app.listen(port, () => {
	logger.info(`Notes app listening at http://localhost:${port}/api`);
});

function gracefulShutdown() {
	logger.info("closing HTTP server");
	server.close(() => {
		databaseConnection.close();
		logger.info("HTTP server closed");
		process.exit(0);
	});
}

process.on("SIGTERM", () => {
	logger.info("SIGTERM signal received");
	gracefulShutdown();
});

process.on("SIGINT", () => {
	logger.info("SIGINT signal received");
	gracefulShutdown();
});
