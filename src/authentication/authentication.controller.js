"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const authService = require("./authentication.service");

const login = asyncMiddleware(async (req) => {
	return await authService.login(req.body);
});

const register = asyncMiddleware(async (req) => {
	return await authService.register(req.body);
});

module.exports = {
	login,
	register
}