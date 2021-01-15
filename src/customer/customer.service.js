"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const { Customer } = require("./customer.model");
const partyHelper = require("./party_internal.helper");
const profileHelper = require("../common/profile/profile.helper");

//private function
async function getTargetCustomer(customerId){
	//validate customerId
	if (mongoose.Types.ObjectId.isValid(customerId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };
	}

	let customer;
	try {
		customer = await Customer.findById(customerId);
	} catch (err) {
		logger.error("Customer.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	if (customer == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };
	}

	return customer;
}

//private function
async function saveCustomer(customer){
	//save to db
	try {
		customer = await customer.save();
	} catch (err) {
		logger.error("customer.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return customerToOutputObj(customer);
}

async function findCustomer(input, user) {

	//validate input data
	const schema = Joi.object({
		customerId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//check for valid customerId
	const targetCustomer = await getTargetCustomer(input.customerId);

	return customerToOutputObj(targetCustomer);
}

async function searchCustomers(input, user) {
	//validate input data
	const schema = Joi.object({
		status: Joi
			.string()
			.valid("ACTIVE", "INACTIVE", null)
	});
	utility.validateInput(schema, input);

	let searchCriteria;
	if (input.status != null) {
		searchCriteria = {
			"status": input.status
		}
	}

	let customers;
	try {
		customers = await Customer.find(searchCriteria);
	} catch (err) {
		logger.error("Customer.find Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//set outputObjs
	var outputObjs = [];
	customers.forEach((item) => {
		outputObjs.push(customerToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"customers": outputObjs
	};
}

async function newCustomer(input, user) {
	//validate input data
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.allow(null),
		personalInfo: Joi
			.object()
			.when("partyId", { is: null, then: Joi.required() }),
		contact: Joi
			.object()
			.allow(null),
		picture: Joi
			.object()
			.allow(null)
	});
	utility.validateInput(schema, input);

	let customer = new Customer();
	customer.status = "ACTIVE";

	//Establish the targetParty. It could be an existing party
	//or create a new party
	let targetParty;

	if(input.partyId){
		//input.partyId is provided. Find existing party
		targetParty = await partyHelper.getParty(input.partyId, user);
	}else{
		//input.partyId not provided. Create new Party
		const newParty = {
			personalInfo: input.personalInfo,
			contact: input.contact,
			picture: input.picture
		}

		targetParty = await partyHelper.createNewParty(newParty);
	}

	//check if customer with the same partyId already exist
	let existingCustomer;
	try{
		existingCustomer = await Customer.findOne({partyId: targetParty.id});
	}catch(error){
		logger.error("Customer.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(existingCustomer){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Customer already exist" };
	}
	
	//set customer attribuest
	customer.partyId = targetParty.id;
	customer.personalInfo = targetParty.personalInfo;

	if(targetParty.contact)
		customer.contact = targetParty.contact;
	
	if(targetParty.picture)
		customer.picture = targetParty.picture;

	return await saveCustomer(customer);
}

async function deleteCustomer(input, user) {
	//validate input data
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	//get target customer
	const targetCustomer = await getTargetCustomer(input.customerId);

	//delete customer record
	try {
		await Customer.findByIdAndDelete(targetCustomer._id.toString());
	} catch (err) {
		console.log(err);
		logger.error("Customer.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return { "status": "SUCCESS" }
}

async function editStatus(input, user) {
	//validate input data
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required(),
		status: Joi
			.string()
			.valid("ACTIVE","INACTIVE")
			.required()
	});
	utility.validateInput(schema, input);

	//get target customer
	let targetCustomer = await getTargetCustomer(input.customerId);

	//update status
	targetCustomer.status = input.status;

	return await saveCustomer(targetCustomer);
}

async function editPersonalInfo(input, user) {
	//validate input data
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required(),
		personalInfo: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	//validate personalInfo input
	input.personalInfo.nameRequired = false;
	profileHelper.validatePersonalInfoInput(input.personalInfo);

	//get target customer
	let targetCustomer = await getTargetCustomer(input.customerId);
	
	//set personalInfo attributes
	targetCustomer = profileHelper.setPersonalInfo(input.personalInfo, targetCustomer);

	//save record
	return await saveCustomer(targetCustomer);
}

async function editContact(input, user) {
	//validate input data
	const schema = Joi.object({
		cusotmerId: Joi
			.string()
			.min(1)
			.required(),
		contact: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	//validate contact input
	profileHelper.validateContactInput(input.contact);

	//get target customer
	let targetCustomer = await getTargetCustomer(input.customerId);

	//set contact attributes
	targetCustomer = profileHelper.setContact(input.contact, targetCustomer);

	//save record
	return await saveCustomer(targetCustomer);
}

async function editPicture(input, user) {
	//validate input data
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required(),
		picture: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	//validate picture input
	profileHelper.validatePictureInput(input.picture);

	let targetCustomer = await getTargetCustomer(input.customerId);

	targetCustomer = profileHelper.setPicture(input.picture, targetCustomer);

	return await saveCustomer(targetCustomer);
}

function customerToOutputObj(customer) {
	var outputObj = new Object();
	outputObj.id = customer._id.toString();
	outputObj.status = customer.status;
	outputObj.partyId = customer.partyId;

	outputObj.personalInfo = customer.personalInfo;

	if(customer.contact.telephoneNumber != null || customer.contact.emailAddress != null){
		outputObj.contact = customer.contact;
	}
	
	if(customer.picture.url != null){
		outputObj.picture = customer.picture;
	}

	return outputObj;
}

module.exports = {
	searchCustomers,
	newCustomer,
	findCustomer,
	deleteCustomer,
	editStatus,
	editPersonalInfo,
	editContact,
	editPicture
}