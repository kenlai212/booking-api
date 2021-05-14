"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {User} = require("./user.model");

async function createUser(input){
	const schema = Joi.object({
		registrationTime: Joi.date().iso().required(),
		activationKey: Joi.string.require(),
		status: Joi.string().required(),
		provider: Joi.string(),
		providerToken: Joi.string(),
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let user = new User();
	user.registrationTime = input.registrationTime;
	user.activationKey = input.activationKey;
	user.status = iput.status;
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
    let user;
	try {
		user = await User.findById(userId);
	} catch (err) {
		logger.error("User.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

	if (!user)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };

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
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid activationKey" };

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

    return user;

}

async function readUserByPersonId(partyId){
	let user;
	try {
		user = await User.findOne({"personId": personId});
	} catch (err) {
		logger.error("User.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

    return user;
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
}

async function deleteAllUsers(){
	try {
		await User.deleteMany();
	} catch (err) {
		logger.error("User.deleteMany Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Users Error" };
	}
}

module.exports = {
	createUser,
	readUser,
    readUserByActivationKey,
    readUserBySocialProfile,
	readUserByPersonId,
    updateUser,
	deleteUser,
	deleteAllUsers
}