"use strict";
const Joi = require("joi");

const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const boatDao = require("./boat.dao");
const {Boat} = require("./boat.model");

async function newBoat(input){
    const schema = Joi.object({
		boatId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	let boat = new Boat();
	boat.boatId = input.boatId;

	boat = await boatDao.save(boat);
	
	logger.info(`Added new Customer(customerId: ${boat.boatId})`);

    return boat; 
}

async function findBoat(input){
	const schema = Joi.object({
		boatId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	const boat = await boatDao.find(input.boatId);

	return boat;
}

async function deleteBoat(input){
	const schema = Joi.object({
		boatId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

    await boatDao.del(input.boatId);

	logger.info(`Deleted boat(${input.boatId})`);

	return {status: "SUCCESS"}
}

async function deleteAllBoats(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await boatDao.deleteAll();

	logger.info("Delete all Boats");

	return {status: "SUCCESS"}
}

module.exports = {
	newBoat,
	findBoat,
	deleteBoat,
	deleteAllBoats
}