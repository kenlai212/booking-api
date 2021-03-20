"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {User} = require("./user.model");
const userObjectMapper = require("./userObjectMapper.helper");

async function findUser(input) {
	const schema = Joi.object({
		id: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	if (mongoose.Types.ObjectId.isValid(input.id) == false)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid id" };

	let user;
	try {
		user = await User.findById(input.id);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(!user){
		try{
			user = await User.findOne({personId : input.id});
		} catch(error){
			logger.error("User.findOne() error : ", err);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}
	}

	if (!user)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "No user found" };

	return userObjectMapper.toOutputObj(user);
}

async function findSocialUser(input) {
	const schema = Joi.object({
		provider: Joi
			.string()
			.valid("GOOGLE", "FACEBOOK")
			.required(),
		providerUserId: Joi
			.string()
			.min(1)
			.max(255)
			.required()
	});
	utility.validateInput(schema, input);

	let user;
	try {
		user = await User.findOne({
			provider: input.provider,
			providerUserId: input.providerUserId
		})
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (!user)
		throw { name: customError.RESOURCE_NOT_FOUND, message: "No user found" };

	return userObjectMapper.toOutputObj(user);
}

module.exports = {
	findUser,
	findSocialUser
}