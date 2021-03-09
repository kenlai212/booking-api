"use strict";
const Joi = require("joi");

const utility = require("../../common/utility");
const {logger, customError} = utility;

const bookingCommon = require("../booking.common");
const customerHelper = require("../customer_internal.helper");

async function addHost(input, user){
	//validate input data
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.allow(null),
		bookingId: Joi
			.string()
			.min(1)
			.required(),
		personalInfo: Joi
			.object()
			.allow(null),
		contact: Joi
			.object()
			.allow(null),
		picture: Joi
			.object()
			.allow(null)
	});
	utility.validateInput(schema, input);

	if(!input.customerId && !input.personalInfo)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Must provide customerId or personalInfo" };

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

	let targetCustomer;
	if(input.customerId){
		//customerId provided. This will be an existing customer
		targetCustomer = await customerHelper.findCustomer({id: input.customerId}, user);

		if(!targetCustomer){
			throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };
		}

	}else{
		//no customerId provided. This will be a new customer

		bookingHelper.validatePersonalInfoInput(input.personalInfo);

		if(input.contact)
		bookingHelper.validateContactInput(input.contact);

		if(input.picture)
		bookingHelper.validatePictureInput(input.picture);

		const newCustomerInput = {
			personalInfo: input.personalInfo,
			contact: input.contact,
			picture: input.picture
		}

		targetCustomer = await customerHelper.newCustomer(newCustomerInput, user);
	}

	let host = new Object();
	host.customerId = targetCustomer.id;

	booking.host = host;

	return await bookingCommon.saveBooking(booking);
}

module.exports = {
	addHost
}