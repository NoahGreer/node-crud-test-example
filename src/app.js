import os from "node:os";
import cluster from "node:cluster";
import process from "node:process";
import NoteDao from "./dao/note-dao.js";
import NoteService from "./service/note-service.js";
import Server from "./api/server.js";
import SqliteConnectionFactory from "./dao/sqlite-connection-factory.js";
import logger from "./util/logger.js";

const port = 3000 || process.env.PORT;

const databaseConnection = SqliteConnectionFactory.createConnection("./notes.db");
const noteDao = new NoteDao(databaseConnection);
const noteService = new NoteService(databaseConnection, noteDao);

const numCpus = os.availableParallelism();

if (cluster.isPrimary) {
	logger.info(`Primary ${process.pid} is running`);

	// Fork workers
	for (let i = 0; i < numCpus; i++) {
		cluster.fork();
	}

	cluster.on("exit", (worker, code, signal) => {
		logger.info(`worker ${worker.process.pid} died`);
	});

	// Handle termination signal
	process.on("SIGTERM", () => {
		logger.info("Master received SIGTERM signal. Terminating workers...");

		for (const worker of Object.values(cluster.workers)) {
			worker.kill();
		}

		process.exit(0);
	});
} else {
	// Worker process

	const app = new Server(noteService).buildApp();

	const server = app.listen(port, () => {
		logger.info(`Notes app worker ${process.pid} listening at http://localhost:${port}/api`);
	});

	process.on("SIGTERM", () => {
		logger.info("Worker received SIGTERM signal. Closing server...");
		server.close(() => {
			databaseConnection.close();
			logger.info("Server closed");
			process.exit(0);
		});
	});

	logger.info(`Worker ${process.pid} started`);
}
