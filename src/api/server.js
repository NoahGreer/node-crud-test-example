import compression from "compression";
import express from "express";
import NoteService from "../service/note-service.js";
import NoteRoutes from "../routes/note-routes.js";
import morgan from "morgan";
import logger from "../util/logger.js";

export default class Server {
	/**
	 * @param {NoteService}
	 */
	#noteService;

	/**
	 *
	 * @param {NoteService} noteService
	 */
	constructor(noteService) {
		this.#noteService = noteService;
	}

	#registerMiddleware(app) {
		app.use(express.json());
		// threshold is the byte threshold for the response body size
		// before compression is considered, the default is 1kb
		app.use(compression({ threshold: 0 }));
		app.use(morgan("combined"));
	}

	#registerRoutes(app) {
		const apiV1Router = express.Router();

		apiV1Router.get("/", (req, res) => {
			res.json({ message: "alive" });
		});

		const noteRoutes = new NoteRoutes(this.#noteService);

		apiV1Router.use("/notes", noteRoutes.buildRouter());

		const apiBaseRouter = express.Router();
		apiBaseRouter.use("/v1", apiV1Router);

		app.use("/api", apiBaseRouter);
	}

	#registerErrorHandler(app) {
		app.use((err, req, res, next) => {
			logger.error(err.stack || err);
			return res.status(500).json(err.message || err);
		});
	}

	/**
	 * @return {express.Express} the configured app
	 */
	buildApp() {
		const app = express();

		this.#registerMiddleware(app);
		this.#registerRoutes(app);
		this.#registerErrorHandler(app);

		return app;
	}
}
