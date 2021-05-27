"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {User} = require("./user.model");

async function createUser(input){
	const schema = Joi.object({
		registrationTime: Joi.date().iso().required(),
		activationKey: Joi.string().required(),
		status: Joi.string().required(),
		provider: Joi.string(),
		providerToken: Joi.string(),
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let user = new User();
	user.registrationTime = input.registrationTime;
	user.activationKey = input.activationKey;
	user.status = input.status;
	user.personId = input.personId;

	if(input.provider)
		user.provider = input.provider;

	if(input.providerUserId)
		user.providerUserId = input.providerUserId;

	try {
		user = await user.save();
	} catch (error) {
		logger.error("user.save() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save User Error" };
	}

	return user;
}

async function readUser(userId){
	if (mongoose.Types.ObjectId.isValid(userId) == false)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid id" };

    let user;
	try {
		user = await User.findById(userId);
	} catch (err) {
		logger.error("User.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

	if (!user)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid userId" };

    return user;
}

async function readUserByActivationKey(activationKey){
    let user;
	try {
		user = await User.findOne({"activationKey": activationKey});
	} catch (err) {
		logger.error("User.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

	if (!user)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid activationKey" };

    return user;
}

async function readUserBySocialProfile(provider, providerUserId){
    let user;
	try {
		user = await User.findOne(
			{
				provider: provider,
				providerUserId: providerUserId
			});
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

	if (!user)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid providerUserId" };

    return user;

}

async function readUserByPersonId(personId){
	let user;
	try {
		user = await User.findOne({"personId": personId});
	} catch (err) {
		logger.error("User.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

	if (!user)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

    return user;
}

async function readUsers(criteria){
	let users;
	try {
		users = await User.find(criteria);
	} catch (err) {
		logger.error("User.find() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return users;
}

async function updateUser(user){
    try {
		user = await user.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save User Error" };
	}

    return user;
}

async function deleteUser(userId){
	try {
		await User.findByIdAndDelete(userId);
	} catch (err) {
		logger.error("User.findByIdAndDeleteError : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete User Error" };
	}

	return;
}

async function deleteAllUsers(){
	try {
		await User.deleteMany();
	} catch (err) {
		logger.error("User.deleteMany Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Users Error" };
	}

	return;
}

module.exports = {
	createUser,
	readUser,
    readUserByActivationKey,
    readUserBySocialProfile,
	readUserByPersonId,
	readUsers,
    updateUser,
	deleteUser,
	deleteAllUsers
}