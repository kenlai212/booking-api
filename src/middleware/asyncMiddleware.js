const logger = require("../common/logger").logger;

const customError = require("../errors/customError");

module.exports = function (handler) {
	return async (req, res, next) => {
		try {
			const response = await handler(req, res);

			logger.info("Response Body : " + JSON.stringify(response));
			res.json(response);
			res.status(200);

		} catch (err) {
			logger.info("Response Error : " + JSON.stringify(err));

			switch (err.name) {
				case customError.UNAUTHORIZE_ERROR:
					res.status(401);
					break;
				case customError.BAD_REQUEST_ERROR:
					res.status(400);
					break;
				case customError.RESOURCE_NOT_FOUND_ERROR:
					res.status(404);
					break;
				case customError.INTERNAL_SERVER_ERROR:
					res.status(500);
				default:
					res.status(500);
			}
			
			res.json({ "error": err.message });
		}

		return res;
	}
}