"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const claimService = require("./claim.service");

const AUTHENTICATION_ADMIN_GROUP = "AUTHENTICATION_ADMIN";

const newClaim = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.newClaim(req.body);
});

const findClaim = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.findClaim(req.params);
});

const updateStatus = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.updateStatus(req.body);
});

const addGroup = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.addGroup(req.body);
});

const removeGroup = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.removeGroup(req.body);
});

const addRole = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.addRole(req.body);
});

const removeRole = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.removeRole(req.body);
});

const deleteClaim = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.deleteClaim(req.params);
});

const deleteAllClaims = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [AUTHENTICATION_ADMIN_GROUP]);

	return await claimService.deleteAllClaims(req.params);
});

module.exports = {
	newClaim,
    findClaim,
    updateStatus,
    addGroup,
    removeGroup,
    addRole,
    removeRole,
    deleteClaim,
    deleteAllClaims
}