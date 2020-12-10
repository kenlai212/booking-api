"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const authService = require("./authentication.service");

const socialLogin = asyncMiddleware(async (req) => {
	return await authService.socialLogin(req.body);
});

module.exports = {
	socialLogin
}