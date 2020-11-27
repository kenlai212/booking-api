"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const adminService = require("./admin.service");
const userAuthorization = require("../common/middleware/userAuthorization");

const USER_ADMIN_GROUP = "USER_ADMIN";

const searchUsers = asyncMiddleware(async (req) => {
	const rightsGroup = [
		USER_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await adminService.searchUsers(req.user);
});

const assignGroup = asyncMiddleware(async (req) => {
	//validate user group rights
	const rightsGroup = [
		USER_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await adminService.assignGroup(req.body, req.user);
});

const unassignGroup = asyncMiddleware(async (req) => {
	//validate user group rights
	const rightsGroup = [
		USER_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await adminService.unassignGroup(req.params, req.user);
});

const editStatus = asyncMiddleware(async (req) => {
	//validate user group rights
	const rightsGroup = [
		USER_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await adminService.editStatus(req.body, req.user);
});

const deleteUser = asyncMiddleware(async (req) => {
	//validate user group rights
	const rightsGroup = [
		USER_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await adminService.deleteUser(req.params, req.user);
});

const resendActivationEmail = asyncMiddleware(async (req) => {
	//validate user group rights
	const rightsGroup = [
		USER_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await adminService.resendActivationEmail(req.body, req.user);
});

const searchGroups = asyncMiddleware(async (req) => {
	//validate user group rights
	const rightsGroup = [
		USER_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await adminService.searchGroups(req.body, req.user);
});

module.exports = {
	searchUsers,
	deleteUser,
	assignGroup,
	unassignGroup,
	editStatus,
	resendActivationEmail,
	searchGroups
}