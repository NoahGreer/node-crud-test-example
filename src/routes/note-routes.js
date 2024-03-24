import express, { Router } from "express";
import { StatusCodes } from "http-status-codes";
import NoteService from "../service/note-service.js";
import { EntityNotFoundError } from "../service/service-error.js";
import { NoteForCreate, NoteForUpdate } from "../model/note.js";
import UuidV4 from "../model/uuidv4.js";
import { isString } from "../util/validation.js";
import logger from "../util/logger.js";

export default class NoteRoutes {
	/**
	 * @type {NoteService}
	 */
	#noteService;

	/**
	 * @param {NoteService} noteService the NoteService to use with the router
	 */
	constructor(noteService) {
		this.#noteService = noteService;
	}

	/**
	 * @param {Router} router
	 */
	#registerRoutes(router) {
		/* GET list page of notes */
		router.get("/", async (req, res, next) => {
			let pageSize = undefined;
			if (req.query.pageSize !== undefined) {
				pageSize = parseInt(req.query.pageSize, 10);
				if (!Number.isInteger(pageSize)) {
					return res.status(StatusCodes.BAD_REQUEST).json({ error: `Invalid pageSize ${req.query.pageSize}` });
				}
			}

			let afterId = undefined;
			if (req.query.afterId !== undefined) {
				try {
					afterId = new UuidV4(req.query.afterId);
				} catch (err) {
					return res.status(StatusCodes.BAD_REQUEST).json({ error: `Invalid afterId ${req.query.afterId}` });
				}
			}

			try {
				res.json(this.#noteService.list(pageSize, afterId));
			} catch (err) {
				logger.error(`Error while handling request to get notes page`, err.message);
				next(err);
			}
		});

		/* GET quote by id */
		router.get("/:id", async (req, res, next) => {
			let id;
			try {
				id = new UuidV4(req.params.id);
			} catch (err) {
				return res.status(StatusCodes.BAD_REQUEST).json({ error: `Invalid id ${req.params.id}` });
			}

			try {
				const note = this.#noteService.findById(id);
				if (!note) {
					return res.status(StatusCodes.NOT_FOUND).send();
				}

				res.json(note);
			} catch (err) {
				logger.error(`Error while handling request to get note for id ${idValue}`, err.message);
				next(err);
			}
		});

		/* POST new quote */
		router.post("/", async (req, res, next) => {
			const content = req.body.content;
			if (content === undefined) {
				return res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing content field" });
			}

			if (!isString(content)) {
				return res.status(StatusCodes.BAD_REQUEST).json({
					error: `Invalid content field value, was type ${typeof content} value "${content}"`,
				});
			}

			let id;
			try {
				id = this.#noteService.create(new NoteForCreate(content));
			} catch (err) {
				logger.error(`Error while handling request to create note with content "${content}"`, err.message);
				next(err);
				return;
			}

			res.status(StatusCodes.CREATED).json({ id: id });
		});

		/* PUT update quote */
		router.put("/:id", async (req, res, next) => {
			let id;
			try {
				id = new UuidV4(req.params.id);
			} catch (err) {
				return res.status(StatusCodes.BAD_REQUEST).json({ error: `Invalid id ${req.params.id}` });
			}

			const content = req.body.content;
			if (content === undefined) {
				return res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing content field" });
			}

			if (!isString(content)) {
				return res.status(StatusCodes.BAD_REQUEST).json({
					error: `Invalid content field value, was type ${typeof content} value "${content}"`,
				});
			}

			try {
				this.#noteService.update(new NoteForUpdate(id, content));
			} catch (err) {
				if (err instanceof EntityNotFoundError) {
					return res.status(StatusCodes.NOT_FOUND).send();
				}

				logger.error(`Error while handling request to update note with id ${id.value}`, err.message);
				next(err);
			}

			res.status(StatusCodes.NO_CONTENT).send();
		});

		/* DELETE quote by id */
		router.delete("/:id", async (req, res, next) => {
			let id;
			try {
				id = new UuidV4(req.params.id);
			} catch (err) {
				return res.status(StatusCodes.BAD_REQUEST).json({ error: `Invalid id ${req.params.id}` });
			}

			try {
				this.#noteService.deleteById(id);
			} catch (err) {
				if (err instanceof EntityNotFoundError) {
					return res.status(StatusCodes.NOT_FOUND).send();
				}

				logger.error(`Error while handling request to delete note with id ${id}`, err.message);
				next(err);
			}

			res.status(StatusCodes.NO_CONTENT).send();
		});
	}

	/**
	 * @return {Router} the configured router
	 */
	buildRouter() {
		const router = express.Router();

		this.#registerRoutes(router);

		return router;
	}
}
