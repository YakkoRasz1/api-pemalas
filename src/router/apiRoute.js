const { Router } = require("express");
const router = Router();

const path = require("path");
const fs = require("fs");

const { responseData, responseMessage } = require("../utils/responseHandler");
const { createQuote } = require("../../lib/maker/quoteMaker");
const { internalError } = require("../utils/values");
const ErrorResponse = require("../utils/responseError");

//lib local
const playstoreSearch = require("../../lib/search/playstoreSearch");
const gsmarenaSearch = require("../../lib/search/gsmarenaSearch");
const instagramPostDownloader = require("../../lib/downloader/instagramPostDownloader");
const gsmarenaDetail = require("../../lib/detail/gsmarenaDetail");

//Middleware
const apikeyAndLimitMiddleware = require("../middleware/apikeyAndLimitMiddleware");
const quoteMakerMiddleware = require("../middleware/quoteMakerMiddleware");
const downloaderMiddleware = require("../middleware/downloaderMiddleware");
const searchMiddleware = require("../middleware/searchMiddleware");

//Searching
router.get("/playstore-search", apikeyAndLimitMiddleware, searchMiddleware(), (req, res, next) => {
	playstoreSearch(res.locals.query)
		.then((data) => {
			if (!data[0].title) {
				next(new ErrorResponse(internalError, 500));
				return false;
			}
			responseData(res, 200, data);
		})
		.catch((er) => {
			console.log(er);
			next(new ErrorResponse(internalError, 500));
		});
});

router.get("/gsmarena-search", apikeyAndLimitMiddleware, searchMiddleware(), (req, res, next) => {
	gsmarenaSearch(res.locals.query)
		.then((data) => {
			if (data == false) {
				next(new ErrorResponse("Not found", 401));
			}
			responseData(res, 200, data);
		})
		.catch((er) => {
			console.log(er);
			next(new ErrorResponse(internalError, 500));
		});
});

//Detail
router.get(
	"/gsmarena-detail",
	apikeyAndLimitMiddleware,
	searchMiddleware({ detail: true }),
	(req, res, next) => {
		gsmarenaDetail(res.locals.query)
			.then((data) => {
				if (data == false) {
					next(new ErrorResponse("Url not valid", 401));
					return false;
				}
				responseData(res, 200, data);
			})
			.catch((er) => {
				console.log(er);
				next(new ErrorResponse(internalError, 500));
			});
	}
);

//Downloader
router.get(
	"/instagram-post-download",
	apikeyAndLimitMiddleware,
	downloaderMiddleware(),
	(req, res, next) => {
		instagramPostDownloader(res.locals.q)
			.then((data) => {
				if (data == "private") {
					next(new ErrorResponse("User private", 401));
					return false;
				}
				if (data == false){
					next(new ErrorResponse("Maybe user private or invalid url", 401));
					return false;
				}
				responseData(res, 200, data);
			})
			.catch((err) => {
				console.log(err);
				next(new ErrorResponse(internalError, 500));
			});
	}
);

//Maker
router.get("/quote-maker", apikeyAndLimitMiddleware, quoteMakerMiddleware, (req, res, next) => {
	const random = Math.random().toString(36).substring(7);
	if (res.locals.bg) {
		createQuote(res.locals.author, res.locals.quote, res.locals.bg)
			.then((data) => {
				fs.writeFileSync(path.join(__dirname, `../public/storage/${random}.jpeg`), data);
				responseData(res, 200, `https://yakko-panel.herokuapp.com/storage/${random}.jpeg`);
			})
			.catch((er) => {
				console.log(er);
				next(new ErrorResponse(internalError, 500));
			});
	} else {
		createQuote(res.locals.author, res.locals.quote)
			.then((data) => {
				fs.writeFileSync(path.join(__dirname, `../public/storage/${random}.jpeg`), data);
				responseData(res, 200, `https://yakko-panel.herokuapp.com/storage/${random}.jpeg`);
			})
			.catch((er) => {
				console.log(er);
				next(new ErrorResponse(internalError, 500));
			});
	}
});
module.exports = router;
