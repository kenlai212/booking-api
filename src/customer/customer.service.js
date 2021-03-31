"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const customerHelper = require("./customer.helper");
const customerDomain = require("./customer.domain");
const { NewCustomerRequest, Customer } = require("./customer.model");

async function initiateNewCustomerRequest(input, user) {
	const schema = Joi.object({
		personId: Joi.string(),
		person: Joi.object({
			name: Joi.string().allow(null),
			dob: Joi.date().iso().allow(null),
			utcOffset: Joi.number().min(-12).max(14).allow(null),
			gender: Joi.string().allow(null),
			phoneNumber: Joi.string().allow(null),
			countryCode: Joi.string().allow(null),
			emailAddress: Joi.string().allow(null)
		})
	});
	utility.validateInput(schema, input);

	if(!input.personId && !input.person)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Either personId or person is mandatory" };	

	let newCustomerRequest = new NewCustomerRequest();
	newCustomerRequest.creationTime = new Date();
	newCustomerRequest.createdBy = user.personId;

	let customer;
	if(input.personId){
		//if personId is provided, it should already in customerPerson DB, create customer record with personId
		customer = customerDomain.createCustomer({personId: input.personId});
		newCustomerWorker.customerId = customer._id.toString();

		newCustomerRequest.status = "COMPLETE";

		//save newCustomerRequest
		try{
			newCustomerRequest = await newCustomerRequest.save();
		}catch(error){
			//since newCustomerRequest failed to save, roll back customer record
			try{
				await Customer.findByIdAndDelete(customer._id);
			}catch(error){
				logger.error("fail to rollback Customer.findByIdAndDelete : ", error);
			}
				
			logger.error("newCustomerWork.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save NewCustomerWork Error" };
		}
	}else{
		//if not personId provided, wait for person domain for a newPerson event.

		newCustomerRequest.status = "AWAITING_PERSON_CREATION";

		if(input.person.name)
			newCustomerRequest.name = input.person.name;

		if(input.person.dob){
			utility.validateDateIsoStr(input.person.dob, input.person.utcOffset);
			newCustomerRequest.dob = utility.isoStrToDate(input.person.dob, input.person.utcOffset);
		}

		if(input.person.gender){
			customerHelper.validateGender(input.person.gender);
			newCustomerRequest.gender = input.person.gender;
		}

		if(input.person.phoneNumber){
			customerHelper.validatePhoneNumber(input.person.countryCode, input.person.phoneNumber);
			newCustomerRequest.countryCode = input.person.countryCode;
			newCustomerRequest.phoneNumber = input.person.phoneNumber;
		}

		if(input.person.emailAddress){
			customerHelper.validateEmailAddress(input.person.emailAddress);
			newCustomerRequest.emailAddress = input.person.emailAddress;
		}

		//save newCustomerRequest
		try{
			newCustomerRequest = await newCustomerRequest.save();
		}catch(error){
			//since newCustomerRequest failed to save, roll back customer record
			try{
				await Customer.findByIdAndDelete(customer._id);
			}catch(error){
				logger.error("fail to rollback Customer.findByIdAndDelete : ", error);
			}
				
			logger.error("newCustomerWork.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save NewCustomerWork Error" };
		}

		//Since this is a new person (personId was not provided), 
		//need to publish to newCustomerPerson queue for person domain to pick up.
		const eventQueueName = "newCustomer";
		await utility.publishEvent(newCustomerRequest, eventQueueName, user)
			.then(() => {
				newCustomerRequest.eventPublishedTime = new Date();
	
				try{
					newCustomerRequest = await newCustomerRequest.save();
				}catch(error){
					logger.error("newCustomerWork.save error : ", error);
					throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save NewCustomerWork Error" };
				}
			})
			.catch(error => {
				//since newCustomerPerson event failed to published, rool back customer and newCustomerRequest
				await cancelNewCustomerRequest({newCustomerRequestId: newCustomerRequest._id});
				throw error;
			});
	}
}

async function completeNewCustomerRequest(input){
	const schema = Joi.object({
		newCustomerRequestId: Joi.string(),
		personId: Joi.string()
	});
	utility.validateInput(schema, input);

	let customer;
	await customerDomain.createCustomer({personId: input.personId})
		.then(result => {
			customer = result;
		})
		.catch(error => {
			logger.error("customerDomain.createCustomer error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Create Customer Error" };	
		});

	let newCustomerRequest;
	try{
		newCustomerRequest = NewCustomerRequest.findById(input.newCustomerRequestId);
	}catch(error){
		logger.error("NewCustomerRequest.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find NewCustomerWork Error" };
	}

	if(!newCustomerRequest)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid customerId" };

	newCustomerRequest.personId = input.personId;
	newCustomerRequest.customerId = customer._id;
	newCustomerRequest.status = "COMPLETE";

	try{
		newCustomerRequest = await newCustomerRequest.save();
	}catch(error){
		logger.error("newCustomerRequest.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save NewCustomerWork Error" };
	}

	return newCustomerRequest;
}

async function cancelNewCustomerRequest(input){
	const schema = Joi.object({
		newCustomerRequestId: Joi.string()
	});
	utility.validateInput(schema, input);

	//find newCustomerRequest record
	let newCustomerRequest;
	try{
		newCustomerRequest = NewCustomerRequest.findById(input.newCustomerRequestId);
	}catch(error){
		logger.error("NewCustomerRequest.findById error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find NewCustomerWork Error" };
	}

	if(!newCustomerRequest)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid newCustomerRequest Error" };

	//find customer record
	let customer;
	try{
		customer = await Customer.findById(newCustomerRequest.customerId);
	}catch(error){
		logger.error("Customer.findById error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
	}

	if(customer && !customer.personId){
		//there is a customer record, but no personId. That means
		//newPerson event likely failed. delete the customer record
		try{
			await Customer.findByIdAndDelete(customer._id);
		}catch(error){
			logger.error("Customer.findByIdAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Customer Error" };
		}
	}

	//delete newCustomerRecord record
	try{
		await NewCustomerRequest.findByIdAndDelete(newCustomerRequest._id);
	}catch(error){
		logger.error("NewCustomerRequest.findByIdAndDelete error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete NewCustomerWork Error" };
	}

	return {status: "SUCCESS"};
}

module.exports = {
	initiateNewCustomerRequest,
	completeNewCustomerRequest,
	cancelNewCustomerRequest
}