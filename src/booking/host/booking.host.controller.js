"use strict";
const url = require("url");

const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const hostService = require("./booking.host.service");

const editHost = asyncMiddleware(async (req) => {
	return await hostService.editHost(req.body, req.user);
});

module.exports = {
	editHost
}