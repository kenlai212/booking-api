const winston = require("winston");

module.exports = function (handler) {
	return async (req, res, next) => {
		try {
			const response = await handler(req, res);

			//winston.info("Response Body : " + JSON.stringify(response));
			res.json(response);
			res.status(200);

		} catch (err) {
			//winston.info("Response Error : " + JSON.stringify(err));

			res.status(err.status);
			res.json({ "error": err.message });
		}

		next();
	}
}