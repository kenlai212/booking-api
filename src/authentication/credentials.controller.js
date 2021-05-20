"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const credentialsService = require("./credentials.service");

const AUTHENTICATION_ADMIN_GROUP = "AUTHENTICATION_ADMIN";

const newCredentials = asyncMiddleware(async (req) => {
	return await credentialsService.newCredentials(req.body);
});

const readCredentials = asyncMiddleware(async (req) => {

    const queryObject = url.parse(req.url, true).query;
	return await credentialsService.readCredentials(queryObject);
});

const deleteCredentials = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await credentialsService.deleteCredentials(req.params);
});

const deleteAllCredentialses = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await credentialsService.deleteAllCredentialses(req.params);
});

module.exports = {
	newCredentials,
    readCredentials,
    deleteCredentials,
    deleteAllCredentialses
}