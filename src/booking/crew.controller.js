"use strict";
const crewService = require("./crew.service");
const gogowakeCommon = require("gogowake-common");

const addCrew = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await crewService.addCrew(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

module.exports = {
	addCrew
}
